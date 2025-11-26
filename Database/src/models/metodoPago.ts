import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement
} from "sequelize-typescript";

@Table({ tableName: "metodoPago", timestamps: false })
export class MetodoPago extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    idMetodo!: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false
    })
    nombre!: string;
}