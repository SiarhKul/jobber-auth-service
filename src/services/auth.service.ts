import { AuthModel } from '@auth/models/auth.schema';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { IAuthBuyerMessageDetails, IAuthDocument } from '@SiarhKul/jobber-shared';
import { omit } from 'lodash';
import { Model } from 'sequelize';

export async function createAuthUser(data: IAuthBuyerMessageDetails): Promise<IAuthDocument> {
  const result: Model = await AuthModel.create(data);
  const messageDetails: IAuthBuyerMessageDetails = {
    username: result.dataValues.username,
    email: result.dataValues.email,
    profilePicture: result.dataValues.profilePicture,
    country: result.dataValues.country,
    createdAt: result.dataValues.createdAt,
    type: 'auth'
  };

  await publishDirectMessage(
    authChannel,
    'jobber-buyer-update',
    'user-buyer',
    JSON.stringify(messageDetails),
    'Buyer details sent to buyer service.'
  );

  const userData: IAuthDocument = omit(result.dataValues, ['password']);

  return userData;
}
