import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    BelongsTo,
} from "sequelize-typescript";

@Table({ tableName: "carrito", timestamps: false })
export class Carrito extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    idCarrito!: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    fechaCreacion!: Date;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    idUsuario!: number;

}