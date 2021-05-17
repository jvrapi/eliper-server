import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateHospitalizationTable1620410451559
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'hospitalization',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'disease_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'surgery_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'location',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '100',
          },
        ],
        foreignKeys: [
          {
            name: 'FK_Hospitalization_User',
            columnNames: ['user_id'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_Hospitalization_Disease',
            columnNames: ['disease_id'],
            referencedTableName: 'disease',
            referencedColumnNames: ['id'],
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_Hospitalization_Surgery',
            columnNames: ['surgery_id'],
            referencedTableName: 'surgery',
            referencedColumnNames: ['id'],
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('hospitalization');
  }
}