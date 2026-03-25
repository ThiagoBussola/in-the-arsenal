"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("card_cache", "sage_legal", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("card_cache", "sage_banned", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("card_cache", "rarities", {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });

    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_decks_format" ADD VALUE IF NOT EXISTS 'SAGE';`
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("card_cache", "sage_legal");
    await queryInterface.removeColumn("card_cache", "sage_banned");
    await queryInterface.removeColumn("card_cache", "rarities");
  },
};
