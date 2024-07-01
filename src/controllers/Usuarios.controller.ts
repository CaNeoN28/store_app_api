import { Prisma } from "@prisma/client";
import { Usuario } from "../types";
import Controller from "./Controller";

export default class Controller_Usuarios extends Controller {
  protected selecionados: Prisma.UsuarioSelect;

  constructor() {
    super("usuario");

    this.selecionados = {};
    this.selecionar_todos_os_campos();
  }
  protected validar_dados(
    data: Usuario,
    validar_obrigatorios?: boolean | undefined
  ) {}
}
