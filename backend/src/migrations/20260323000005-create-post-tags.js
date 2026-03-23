"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("post_tags", {
      post_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "posts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        primaryKey: true,
      },
      tag_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "tags", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        primaryKey: true,
      },
    });

    await queryInterface.addIndex("post_tags", ["post_id", "tag_id"], {
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("post_tags");
  },
};
