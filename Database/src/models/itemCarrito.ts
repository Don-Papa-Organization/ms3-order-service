import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    ForeignKey,
    BelongsTo,
    AllowNull
} from "sequelize-typescript";
import { Carrito } from "./carrito";

@Table({ tableName: "itemCarrito", timestamps: false })
export class ItemCarrito extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    idItemCarrito!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    cantidad!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false
    })
    subtotal!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false
    })
    precioUnitario!: number;

    @ForeignKey(() => Carrito)
    @Column(DataType.INTEGER)
    idCarrito!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    idProducto!: number;

    @BelongsTo(() => Carrito)
    carrito!: Carrito;
}