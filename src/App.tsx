// src/App.tsx
import { BiBookAdd, BiTrash } from "react-icons/bi";
import {
  listarTarefas,
  criarTarefa,
  deletarTarefa,
  realizarTarefa,
  atualizarOrdemTarefa
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
        console.error("Formato inesperado de tarefas:", payload);
        setTarefas([]);
      } else {
        setTarefas(lista);
      }
    } catch (err) {
      console.error("Erro ao listar tarefas:", err);
      alert("Erro ao carregar tarefas do backend.");
      setTarefas([]);
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
    } catch (err) {
      console.error("Erro ao criar tarefa:", err);
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
    if (!confirm("Deseja realmente deletar essa tarefa?")) return;

    await deletarTarefa(id);
    await carregarTarefas();
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const novaLista = Array.from(tarefas);
    const [removido] = novaLista.splice(result.source.index, 1);
    novaLista.splice(result.destination.index, 0, removido);

    setTarefas(novaLista);

    const id = removido.id
    const novaPosicao = result.destination.index + 1

    try {
      await atualizarOrdemTarefa(id!, novaPosicao)
    } catch (err) {
      console.error("Erro ao atualizar ordem:", err);
    }
  }


  return (
    <div>
      <header className="flex w-full h-33 justify-center bg-amber-400 flex-col items-center">
        <div className="flex items-center justify-center">
          <BiBookAdd size={24} color="black" />
          <h1 className="text-center text-3xl font-bold">Organize App</h1>
        </div>
        <p className="mt-2">sua agenda pessoal para todas as demandas</p>
      </header>

      <section className="w-full p-2">
        {/* FORMULÁRIO */}
        <div className="bg-amber-300 w-full rounded-lg p-3 pb-5">
          <form onSubmit={handleSubmit} className="flex items-center justify-center flex-col">
            <h1 className="text-black font-medium text-xl mb-3">Crie uma nova Tarefa</h1>

            <input
              type="text"
              className="bg-white w-100 rounded-md p-1 outline-0"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />

            <input
              type="submit"
              value="Create"
              className="bg-amber-500 w-100 rounded-md mt-3 text-black font-medium cursor-pointer hover:bg-amber-200 p-1"
            />
          </form>
        </div>

        {/* TABELA + DRAG AND DROP */}
        <div className="tabela mt-5">
          {loading ? (
            <div className="p-4">Carregando tarefas...</div>
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
                        <th className="border border-black p-2">Check</th>
                        <th className="border border-black p-2">Deletar</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tarefas.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={String(item.id)}
                          index={index}
                        >
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
                                {item.dataCriacao
                                  ? new Date(item.dataCriacao).toLocaleString()
                                  : "-"}
                              </td>

                              <td className="border border-black p-2">
                                {item.realizada ? "Sim" : "Não"}
                              </td>

                              <td className="border border-black p-2">
                                <button
                                  onClick={() => handleCheck(item.id)}
                                  className={
                                    item.realizada
                                      ? "bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-400"
                                      : "bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-400"
                                  }
                                >
                                  {item.realizada ? "X" : "✓"}
                                </button>
                              </td>

                              <td className="border border-black p-2">
                                <button
                                  className="bg-red-500 p-1 rounded-md hover:bg-red-400 cursor-pointer"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <BiTrash size={20} color="white" />
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
        </div>
      </section>
    </div>
  );
}

export default App;
