"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("card_cache", {
      unique_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
      },
      name: { type: Sequelize.STRING(200), allowNull: false },
      color: { type: Sequelize.STRING(10), allowNull: true },
      pitch: { type: Sequelize.STRING(5), allowNull: true },
      cost: { type: Sequelize.STRING(5), allowNull: true },
      power: { type: Sequelize.STRING(5), allowNull: true },
      defense: { type: Sequelize.STRING(5), allowNull: true },
      health: { type: Sequelize.STRING(5), allowNull: true },
      types: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      card_keywords: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      functional_text: { type: Sequelize.TEXT, allowNull: true },
      type_text: { type: Sequelize.STRING(200), allowNull: true },
      image_url: { type: Sequelize.STRING(500), allowNull: true },
      cc_legal: { type: Sequelize.BOOLEAN, defaultValue: false },
      blitz_legal: { type: Sequelize.BOOLEAN, defaultValue: false },
      commoner_legal: { type: Sequelize.BOOLEAN, defaultValue: false },
      ll_legal: { type: Sequelize.BOOLEAN, defaultValue: false },
      cc_banned: { type: Sequelize.BOOLEAN, defaultValue: false },
      blitz_banned: { type: Sequelize.BOOLEAN, defaultValue: false },
      commoner_banned: { type: Sequelize.BOOLEAN, defaultValue: false },
      ll_banned: { type: Sequelize.BOOLEAN, defaultValue: false },
      cached_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("card_cache", ["name"]);
    await queryInterface.addIndex("card_cache", ["types"], { using: "gin" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("card_cache");
  },
};
