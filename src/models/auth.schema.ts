import { DataTypes, Model } from 'sequelize';
import { sequelize } from '@auth/database';
import { IAuthDocument } from '@SiarhKul/jobber-shared';
import { compare, hash } from 'bcryptjs';

const SALT_ROUND = 10;

type RequiredAuthUserFields =
  | 'username'
  | 'password'
  | 'profilePublicId'
  | 'email'
  | 'country'
  | 'profilePicture'
  | 'emailVerificationToken';

export type AuthUserAttributes = Omit<IAuthDocument, 'comparePassword' | 'hashPassword'> &
  Required<Pick<IAuthDocument, RequiredAuthUserFields>>;

interface AuthModelInstance extends Model<AuthUserAttributes, AuthUserAttributes> {
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
}

const AuthModel = sequelize.define<AuthModelInstance>(
  'auths',
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    profilePublicId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: false
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Date.now
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date()
    }
  },
  {
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['username'] }
    ]
  }
);

AuthModel.addHook('beforeCreate', async (auth) => {
  const hashedPassword = await hash(auth.getDataValue('password'), SALT_ROUND);
  auth.setDataValue('password', hashedPassword);
});

Object.assign(AuthModel.prototype, {
  async comparePassword(password, hashedPassword) {
    return compare(password, hashedPassword);
  },
  async hashPassword(password) {
    return hash(password, SALT_ROUND);
  }
} satisfies Pick<AuthModelInstance, 'comparePassword' | 'hashPassword'>);

AuthModel.sync({});

export { AuthModel };
