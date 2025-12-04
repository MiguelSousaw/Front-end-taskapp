// src/services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/tarefasapp",
  headers: {
    "Content-Type": "application/json",
  },
});

export type TarefaProps = {
  id?: number;
  realizada: boolean;
  dataCriacao: string | Date; // pode vir como string do backend
  titulo: string;
  dataAtualizacao: string
};

export const listarTarefas = () => api.get("/tarefas/listar");
export const criarTarefa = (tarefa: Partial<TarefaProps>) =>
  api.post("/tarefas/criar", tarefa, {
    headers: { "Content-Type": "application/json" },
  });
export const deletarTarefa = (id: number) => api.delete(`/tarefas/deletar/${id}`);
export const realizarTarefa = (id: number) => api.put(`/tarefas/realizar/${id}`); 

export const atualizarOrdemTarefa = (id: number, posicao: number) => api.put(`/tarefas/atualizarOrdem/${id}/${posicao}`);

export const editarTarefa = (id: number, novoTitulo: string) => api.put(`/tarefas/editar/${id}`, {titulo: novoTitulo});

export default api;
