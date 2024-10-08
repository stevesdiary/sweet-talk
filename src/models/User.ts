import { DataTypes, Model, Sequelize, UUID } from 'sequelize';
import { sequelize } from './index';
import Quality from './Quality';
import Interest from './Interest';
import UserQuality from './UserQuality';
import UserInterest from './UserInterest';

class User extends Model {
	age!: number;
	qualities!: string[];
	hobbies_and_interests!: string[];
	gender!: string;
	last_name!: string;
	first_name!: string;
	username!: string;
	user_id!: string;
	role!: string;
  subscribed!: boolean;
  dp!: string;
}
User.init({
  user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING,
  },
  state_or_province: {
    type: DataTypes.STRING,
  },
  state_of_origin: {
    type: DataTypes.STRING,
  },
  gender: {
    type: DataTypes.ENUM,
    values: ['male', 'female'],
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
  },
  education_level: {
    type: DataTypes.STRING,
  },
  profession: {
    type: DataTypes.STRING,
  },
  hobbies_and_interests: {
    type: DataTypes.JSON,
  },
  qualities: {
    type: DataTypes.JSON,
  },
  subscribed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  role: {
    type: DataTypes.ENUM,
    values: ['basic', 'premium'],
    defaultValue: 'basic'
  },
  dp: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  paranoid: true,
});

// User.belongsToMany(Quality, { through: UserQuality, as: 'quality', foreignKey: 'user_id' });
// Quality.belongsToMany(User, { through: UserQuality, as: 'users', foreignKey: 'quality_id' });

// User.belongsToMany(Interest, { through: UserInterest, as: 'interest', foreignKey: 'user_id' });
// Interest.belongsToMany(User, { through: UserInterest, as: 'users', foreignKey: 'interest_id' });

export default User;

