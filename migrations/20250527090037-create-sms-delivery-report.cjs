'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sms_delivery_reports', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      correlator: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
      },
      created_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      delivery_status: {
        type: Sequelize.ENUM('Pending', 'DeliveredToTerminal'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      delivered_date: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sms_delivery_reports');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sms_delivery_reports_delivery_status";');
  },
};
