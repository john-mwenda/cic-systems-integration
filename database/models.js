import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default (sequelize) => {
  const SmsDeliveryReport = sequelize.define('SmsDeliveryReport', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    correlator: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      unique: true
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    delivery_status: {
      type: DataTypes.ENUM('Pending', 'DeliveredToTerminal'),
      defaultValue: 'Pending',
      allowNull: false
    },
    delivered_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'sms_delivery_reports',
    timestamps: true
  });

  return SmsDeliveryReport;
};
