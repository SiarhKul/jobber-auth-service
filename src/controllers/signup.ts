import { signupSchema } from '@auth/schemas/signup';
import {
  createdAndPublishAuthUser,
  getUserByUsernameOrEmail,
  signToken
} from '@auth/services/auth.service';
import {
  BadRequestError,
  firstLetterUppercase,
  IEmailMessageDetails,
  lowerCase
} from '@SiarhKul/jobber-shared';
import cloudinary from 'cloudinary';
import { Request, Response } from 'express';

import crypto from 'crypto';

import { v4 as uuidV4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { publishDirectMessage } from '@auth/queues/auth.producer';

import { config } from '../configuration';
import { authChannel } from '../server';

export async function create(req: Request, res: Response): Promise<void> {
  const { error } = await Promise.resolve(signupSchema.validate(req.body));

  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Signup create() method error');
  }

  const { username, email, password, country, profilePicture } = req.body;

  const existingUser = await getUserByUsernameOrEmail(username, email);

  if (existingUser) {
    throw new BadRequestError(
      'Invalid credentials. Email or Username',
      'SignUp create() method error'
    );
  }

  const profilePublicId = uuidV4();
  const uploadResult = await cloudinary.v2.uploader
    .upload(profilePicture, {
      public_id: profilePublicId,
      overwrite: true,
      invalidate: true,
      resource_type: 'image'
    })
    .catch(() => undefined);

  if (!uploadResult?.public_id || !uploadResult.secure_url) {
    throw new BadRequestError('File upload error. Try again', 'SignUp create() method error');
  }

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');

  const authData = {
    username: firstLetterUppercase(username),
    email: lowerCase(email),
    profilePublicId,
    password,
    country,
    profilePicture: uploadResult.secure_url,
    emailVerificationToken: randomCharacters
  };

  const result = await createdAndPublishAuthUser(authData);

  const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;

  const messageDetails: IEmailMessageDetails = {
    receiverEmail: result.email,
    verifyLink: verificationLink,
    template: 'verifyEmail'
  };

  await publishDirectMessage(
    authChannel,
    'jobber-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Verify email message has been sent to notification service.'
  );

  const userJWT: string = signToken(result.id!, result.email!, result.username!);

  res
    .status(StatusCodes.CREATED)
    .json({ message: 'User created successfully', user: result, token: userJWT });
}
