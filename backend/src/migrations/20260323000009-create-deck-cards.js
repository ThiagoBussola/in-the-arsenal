"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("deck_cards", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      deck_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "decks", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      card_unique_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      zone: {
        type: Sequelize.ENUM("MAIN", "EQUIPMENT", "WEAPON", "SIDEBOARD"),
        allowNull: false,
        defaultValue: "MAIN",
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

    await queryInterface.addIndex("deck_cards", ["deck_id"]);
    await queryInterface.addIndex("deck_cards", ["card_unique_id"]);
    await queryInterface.addIndex("deck_cards", ["deck_id", "card_unique_id"], {
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("deck_cards");
  },
};
