import { AuthModel, type AuthUserAttributes } from '@auth/models/auth.schema';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { omit } from 'lodash';

import type { IAuthBuyerMessageDetails } from '@SiarhKul/jobber-shared';

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
