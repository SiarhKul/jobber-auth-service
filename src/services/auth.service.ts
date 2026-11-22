import { AuthModel, type AuthUserAttributes } from '@auth/models/auth.schema';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { omit } from 'lodash';
import { Op } from 'sequelize';

import {
  firstLetterUppercase,
  lowerCase,
  type IAuthBuyerMessageDetails
} from '@SiarhKul/jobber-shared';
import { sign } from 'jsonwebtoken';
import { config } from '@auth/configuration';

export async function createAuthUser(
  data: AuthUserAttributes
): Promise<Omit<AuthUserAttributes, 'password'>> {
  const { dataValues } = await AuthModel.create(data);

  const messageDetails: IAuthBuyerMessageDetails = {
    username: dataValues.username,
    email: dataValues.email,
    profilePicture: dataValues.profilePicture,
    country: dataValues.country,
    createdAt: dataValues.createdAt,
    type: 'auth'
  };

  await publishDirectMessage(
    authChannel,
    'jobber-buyer-update',
    'user-buyer',
    JSON.stringify(messageDetails),
    'Buyer details sent to buyer service.'
  );

  return omit(dataValues, ['password']);
}

export async function getAuthUserById(
  authId: number
): Promise<Omit<AuthUserAttributes, 'password'> | null> {
  const user = await AuthModel.findByPk(authId);

  if (!user) {
    return null;
  }

  return omit(user.dataValues, ['password']);
}

export async function getUserByUsernameOrEmail(
  username: string,
  email: string
): Promise<Omit<AuthUserAttributes, 'password'> | null> {
  const user = await AuthModel.findOne({
    where: {
      [Op.or]: [{ username: firstLetterUppercase(username) }, { email: lowerCase(email) }]
    }
  });

  if (!user) {
    return null;
  }

  return omit(user.dataValues, ['password']);
}

export async function getUserByUsername(
  username: string
): Promise<Omit<AuthUserAttributes, 'password'> | null> {
  const user = await AuthModel.findOne({
    where: { username: firstLetterUppercase(username) }
  });

  if (!user) {
    return null;
  }

  return omit(user.dataValues, ['password']);
}

export async function getUserByEmail(
  email: string
): Promise<Omit<AuthUserAttributes, 'password'> | null> {
  const user = await AuthModel.findOne({
    where: { email: lowerCase(email) }
  });

  if (!user) {
    return null;
  }

  return omit(user.dataValues, ['password']);
}

export async function getAuthUserByVerificationToken(
  token: string
): Promise<AuthUserAttributes | null> {
  const user = await AuthModel.findOne({
    where: { emailVerificationToken: token },
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    return null;
  }

  return user.dataValues;
}

export async function getAuthUserByPasswordToken(
  token: string
): Promise<AuthUserAttributes | null> {
  const user = await AuthModel.findOne({
    where: {
      [Op.and]: [{ passwordResetToken: token }, { passwordResetExpires: { [Op.gt]: new Date() } }]
    }
  });

  if (!user) {
    return null;
  }

  return user.dataValues;
}

export async function updateVerificationField(
  authId: number,
  emailVerified: number,
  emailVerificationToken: string
): Promise<void> {
  await AuthModel.update(
    {
      emailVerified,
      emailVerificationToken
    },
    {
      where: { id: authId }
    }
  );
}

export async function updatePasswordToken(
  authId: number,
  token: string,
  tokenExpiration: Date
): Promise<void> {
  await AuthModel.update(
    {
      passwordResetToken: token,
      passwordResetExpires: tokenExpiration
    },
    {
      where: { id: authId }
    }
  );
}

export async function updatePassword(authId: number, password: string): Promise<void> {
  await AuthModel.update(
    {
      password,
      passwordResetToken: '',
      passwordResetExpires: new Date()
    },
    { where: { id: authId } }
  );
}

export function signToken(id: number, email: string, username: string): string {
  return sign(
    {
      id,
      email,
      username
    },
    config.JWT_TOKEN!
  );
}
