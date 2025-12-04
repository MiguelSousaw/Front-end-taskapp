// src/App.tsx
import { BiBookAdd, BiTrash, BiEdit } from "react-icons/bi";
import {
  listarTarefas,
  criarTarefa,
  deletarTarefa,
  realizarTarefa,
  atualizarOrdemTarefa,
  editarTarefa
} from "./services/api";

import type { TarefaProps } from "./services/api";
import type { FormEvent } from "react";
import { useState, useEffect } from "react";

import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [tarefas, setTarefas] = useState<TarefaProps[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [modal, setModal] = useState(false);
  const [tarefaAlt, setTarefaAlt] = useState("");
  const [tarefaIdAtual, setTarefaIdAtual] = useState<number | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");

  useEffect(() => {
    carregarTarefas();
  }, []);

  async function carregarTarefas() {
    setLoading(true);
    try {
      const resp = await listarTarefas();
      const payload = resp?.data;
      const lista = payload?.data ?? payload ?? [];

      if (!Array.isArray(lista)) {
        console.error("Formato inesperado:", payload);
        setTarefas([]);
      } else {
        setTarefas(lista);
      }
    } catch (err) {
      console.error("Erro ao listar tarefas:", err);
      alert("Erro ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) {
      alert("Título obrigatório");
      return;
    }

    const novaTarefa = {
      titulo: input.trim(),
      realizada: false,
      dataCriacao: new Date().toISOString(),
    };

    try {
      await criarTarefa(novaTarefa);
      setInput("");
      await carregarTarefas();
    } catch {
      alert("Erro ao criar tarefa.");
    }
  }

  async function handleCheck(id?: number) {
    if (!id) return;
    await realizarTarefa(id);
    await carregarTarefas();
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    if (!confirm("Deseja realmente deletar?")) return;

    await deletarTarefa(id);
    await carregarTarefas();
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const novaLista = Array.from(tarefas);
    const [removido] = novaLista.splice(result.source.index, 1);
    novaLista.splice(result.destination.index, 0, removido);
    setTarefas(novaLista);

    const id = removido.id;
    const novaPosicao = result.destination.index + 1;

    try {
      await atualizarOrdemTarefa(id!, novaPosicao);
    } catch (err) {
      console.error("Erro ao atualizar ordem:", err);
    }
  }

  // ABRIR MODAL
  function handleModal(index?: number) {
    if (index === undefined) return;

    const task = tarefas[index];

    setTarefaAlt(task.titulo);
    setTarefaIdAtual(task.id!);

    // carrega a última atualização vinda do backend
    if (task.dataAtualizacao) {
      setUltimaAtualizacao(
        new Date(task.dataAtualizacao).toLocaleString("pt-BR")
      );
    } else {
      setUltimaAtualizacao("");
    }

    setModal(true);
  }

  // EDITAR
  async function handleEdit() {
    if (!tarefaIdAtual) return;
    if (!tarefaAlt.trim()) {
      alert("O título não pode ser vazio.");
      return;
    }

    try {
      await editarTarefa(tarefaIdAtual, tarefaAlt.trim());
      await carregarTarefas();
      setModal(false);
    } catch {
      alert("Erro ao editar tarefa.");
    }
  }

  return (
    <div className="relative">
      <header className="flex w-full h-33 justify-center bg-amber-400 flex-col items-center">
        <div className="flex items-center justify-center">
          <BiBookAdd size={24} color="black" />
          <h1 className="text-center text-3xl font-bold">Organize App</h1>
        </div>
        <p className="mt-2">sua agenda pessoal para todas as demandas</p>
      </header>

      <section className="w-full p-2">
        
        {/* FORM */}
        <div className="bg-amber-300 w-full rounded-lg p-3 pb-5">
          <form onSubmit={handleSubmit} className="flex items-center justify-center flex-col">
            <h1 className="text-black font-medium text-xl mb-3">Crie uma nova Tarefa</h1>

            <input
              type="text"
              className="bg-white w-100 rounded-md p-1 outline-0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <input
              type="submit"
              value="Create"
              className="bg-amber-500 w-100 rounded-md mt-3 text-black font-medium cursor-pointer hover:bg-amber-200 p-1"
            />
          </form>
        </div>

        {/* LISTA */}
        <div className="tabela mt-5 relative">

          {loading ? (
            <div className="p-4">Carregando...</div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="lista-tarefas">
                {(provided) => (
                  <table
                    className="w-full border-collapse border border-black"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <thead>
                      <tr className="bg-amber-200">
                        <th className="border border-black p-2">ID</th>
                        <th className="border border-black p-2">Título</th>
                        <th className="border border-black p-2">Data Criação</th>
                        <th className="border border-black p-2">Realizada</th>
                        <th className="border border-black p-2">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tarefas.map((item, index) => (
                        <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                          {(provided) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="text-center cursor-grab"
                            >
                              <td className="border border-black p-2">{item.id}</td>
                              <td className="border border-black p-2">{item.titulo}</td>

                              <td className="border border-black p-2">
                                {item.dataCriacao ? new Date(item.dataCriacao).toLocaleString() : "-"}
                              </td>

                              <td className="border border-black p-2">
                                {item.realizada ? "Sim" : "Não"}
                              </td>

                              <td className="border border-black p-2 flex gap-4 justify-center">
                                <button
                                  onClick={() => handleCheck(item.id)}
                                  className={item.realizada
                                    ? "bg-green-500 text-white px-3 py-1 rounded-md"
                                    : "bg-red-500 text-white px-3 py-1 rounded-md"}
                                >
                                  {item.realizada ? "✓" : "X"}
                                </button>

                                <button
                                  className="bg-red-500 p-1 rounded-md hover:bg-red-400 cursor-pointer"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <BiTrash size={20} color="white" />
                                </button>

                                <button
                                  className="bg-blue-400 px-3 rounded-md font-medium p-1 cursor-pointer"
                                  onClick={() => handleModal(index)}
                                >
                                  <BiEdit size={22} color="white" />
                                </button>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}
                    </tbody>
                  </table>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {modal && (
            <div
              onClick={() => setModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
          )}

          {/* MODAL */}
          {modal && (
            <div className="modal w-md bg-amber-300 fixed top-[50%] left-[50%] translate-[-50%] rounded-md p-4 flex flex-col items-center shadow-xl z-50 animate-[slideUp_0.25s_ease-out]">

              <h1 className="font-medium text-2xl mb-4 text-black">Atualizar Tarefa</h1>

              <input
                type="text"
                className="bg-white w-100 rounded-md h-8 p-2 outline-0 mb-3"
                value={tarefaAlt}
                onChange={(e) => setTarefaAlt(e.target.value)}
              />

              <button
                className="bg-amber-500 rounded-md px-3 py-1 font-medium cursor-pointer w-100 mb-8 hover:bg-amber-400"
                onClick={handleEdit}
              >
                editar
              </button>

              <p className="text-slate-700 text-sm">
                última atualização:{" "}
                {ultimaAtualizacao || "Nenhuma alteração ainda"}
              </p>
            </div>
          )}

        </div>
      </section>

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 20%); opacity: 0; }
          to   { transform: translate(-50%, -50%); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;
