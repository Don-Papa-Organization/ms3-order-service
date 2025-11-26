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

@Table({ tableName: "pedido", timestamps: false })
export class Pedido extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    idPedido!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false
    })
    total!: number;

    @Column({
        type: DataType.ENUM('web', 'fisico'),
        allowNull: false
    })
    canalVenta!: string;

    @Column({
        type: DataType.ENUM('pendiente', 'pagado', 'cancelado'),
        allowNull: false
    })
    estado!: string;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    fechaPedido!: Date;

    @Column({
        type: DataType.STRING(200),
        allowNull: true
    })
    direccionEntrega?: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    idUsuario!: number;

}