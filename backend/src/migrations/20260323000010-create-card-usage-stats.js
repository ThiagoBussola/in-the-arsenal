"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("card_usage_stats", {
      hero_card_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        primaryKey: true,
      },
      card_unique_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        primaryKey: true,
      },
      format: {
        type: Sequelize.ENUM("CC", "BLITZ", "COMMONER", "LL"),
        allowNull: false,
        primaryKey: true,
      },
      deck_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_hero_decks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      usage_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("card_usage_stats", ["hero_card_id"]);
    await queryInterface.addIndex("card_usage_stats", ["card_unique_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("card_usage_stats");
  },
};
