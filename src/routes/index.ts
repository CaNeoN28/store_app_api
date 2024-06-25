import { Router } from "express";
import router_itens from "./itens.router";
import router_clientes from "./clientes.router";
import router_compras from "./compras.router";
import router_fornecedor from "./fornecedor.router";
import router_grupos from "./grupos.router";
import router_unidades from "./unidades.router";
import router_usuarios from "./usuarios.router";
import router_vendas from "./venda.router";

function config_router() {
  const router = Router();

  router.get("/", (req, res) => {
    res.status(200).send("Hello world");
  });

  router.use(
    router_itens,
    router_clientes,
    router_compras,
    router_fornecedor,
    router_grupos,
    router_itens,
    router_unidades,
    router_usuarios,
    router_vendas
  );

  return router;
}

export default config_router;
