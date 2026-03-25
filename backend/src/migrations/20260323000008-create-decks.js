"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("decks", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(200), allowNull: false },
      slug: { type: Sequelize.STRING(220), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      hero_card_id: { type: Sequelize.STRING(50), allowNull: true },
      format: {
        type: Sequelize.ENUM("CC", "BLITZ", "COMMONER", "LL"),
        allowNull: false,
        defaultValue: "CC",
      },
      visibility: {
        type: Sequelize.ENUM("PUBLIC", "PRIVATE"),
        allowNull: false,
        defaultValue: "PRIVATE",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("decks", ["slug"], { unique: true });
    await queryInterface.addIndex("decks", ["user_id"]);
    await queryInterface.addIndex("decks", ["hero_card_id"]);
    await queryInterface.addIndex("decks", ["format"]);
    await queryInterface.addIndex("decks", ["visibility"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("decks");
  },
};
