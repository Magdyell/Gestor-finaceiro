const gastoForm = document.getElementById("gastoForm");
const descricaoInput = document.getElementById("descricao");
const valorInput = document.getElementById("valor");
const categoriaInput = document.getElementById("categoria");
const dataInput = document.getElementById("data");
const receitaInput = document.getElementById("receita");
const filtroMes = document.getElementById("filtroMes");

const listaGastos = document.getElementById("listaGastos");
const totalGasto = document.getElementById("totalGasto");
const receitaValor = document.getElementById("receitaValor");
const saldo = document.getElementById("saldo");
const listaCategorias = document.getElementById("listaCategorias");
const graficoResumo = document.getElementById("graficoResumo");
const graficoCategorias = document.getElementById("graficoCategorias");

console.log("graficoResumo:", graficoResumo);
console.log("graficoCategorias:", graficoCategorias);
console.log("Chart:", typeof Chart);

let graficoBarra = null;
let graficoPizza = null;
let gastos = [];
let receitasPorMes = {};

function marcarComoPago(index) {
    gastos[index].status = "pago";
    salvarDados();
    renderizarGastos();
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function salvarDados() {
    localStorage.setItem("gastos", JSON.stringify(gastos));
    localStorage.setItem("receitasPorMes", JSON.stringify(receitasPorMes));
}

function carregarDados() {
    const gastosSalvos = localStorage.getItem("gastos");
    const receitasSalvas = localStorage.getItem("receitasPorMes");

    gastos = gastosSalvos ? JSON.parse(gastosSalvos) : [];
    receitasPorMes = receitasSalvas ? JSON.parse(receitasSalvas) : {};
}

function extrairMes(data) {
    if (!data) return "";
    return data.slice(0, 7);
}

function garantirMesSelecionado() {
    if (!filtroMes.value) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        filtroMes.value = `${ano}-${mes}`;
    }
}

function obterMesAtual() {
    return filtroMes.value;
}

function obterReceitaDoMes() {
    const mes = obterMesAtual();
    return Number(receitasPorMes[mes]) || 0;
}

function atualizarCampoReceita() {
    const mes = obterMesAtual();
    receitaInput.value = receitasPorMes[mes] ?? "";
}
function temaEscuroAtivo() {
    return document.body.classList.contains("dark");
}
function renderizarCategorias(totaisPorCategoria) {
    listaCategorias.innerHTML = "";

    const categorias = Object.entries(totaisPorCategoria);

    if (categorias.length === 0) return;

    // 🔥 soma total
    const totalGeral = categorias.reduce((acc, [, valor]) => acc + valor, 0);

    // 🔥 ordenar do maior pro menor
    categorias.sort((a, b) => b[1] - a[1]);

    categorias.forEach(([categoria, valor]) => {
        const porcentagem = ((valor / totalGeral) * 100).toFixed(1);

        const li = document.createElement("li");

        li.innerHTML = `
            <div class="categoria-topo">
                <span>${categoria}</span>
                <span>R$ ${valor.toFixed(2)}</span>
            </div>
            <div class="categoria-barra">
                <div class="categoria-barra-fill" style="width: ${porcentagem}%"></div>
            </div>
        `;

        listaCategorias.appendChild(li);
    });
}

function renderizarGraficoResumo(receita, totalGasto) {
    const modoEscuro = temaEscuroAtivo();
    const corTexto = modoEscuro ? "#f9fafb" : "#1f2937";
    const corGrade = modoEscuro ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)";

    if (!graficoResumo) {
        console.log("Canvas graficoResumo não encontrado.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.log("Chart.js não carregou.");
        return;
    }

    if (graficoBarra) {
        graficoBarra.destroy();
        graficoBarra = null;
    }

    const porcentagemGasta =
        receita > 0 ? ((totalGasto / receita) * 100).toFixed(1) : 0;

    const ctx = graficoResumo.getContext("2d");

    graficoBarra = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Receita", `Gasto (${porcentagemGasta}%)`],
            datasets: [
                {
                    label: "Valores do mês",
                    data: [receita, totalGasto],
                    backgroundColor: [
                        "rgb(4, 0, 255)",
                        "rgb(141, 0, 0)"
                    ],
                    borderColor: [
                        "rgb(25, 0, 255)",
                        "rgba(119, 2, 27, 1)"
                    ],
                    borderWidth: 2,
                    borderColor: "#000000"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: corTexto
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: corTexto
                    },
                    grid: {
                        color: corGrade
                    }
                },
                y: {
                    ticks: {
                        color: corTexto
                    },
                    grid: {
                        color: corGrade
                    }
                }
            }
        }
    });
}

function renderizarGraficoCategorias(totaisPorCategoria) {
    const modoEscuro = temaEscuroAtivo();
    const corTexto = modoEscuro ? "#f9fafb" : "#1f2937";
    const corGrade = modoEscuro ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)";

    if (!graficoCategorias) {
        console.log("Canvas graficoCategorias não encontrado.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.log("Chart.js não carregou.");
        return;
    }

    if (graficoPizza) {
        graficoPizza.destroy();
        graficoPizza = null;
    }

    const categorias = Object.keys(totaisPorCategoria);
    const valores = Object.values(totaisPorCategoria);

    if (categorias.length === 0) {
        return;
    }

    const ctx = graficoCategorias.getContext("2d");

    graficoPizza = new Chart(ctx, {
        type: "pie",
        data: {
            labels: categorias,
            datasets: [
                {
                    label: "Gastos por categoria",
                    data: valores,
                    backgroundColor: [
                        "#1100ff",
                        "#ff0000",
                        "#493333",
                        "#006927",
                        "#ff00ea",
                        "#9a2fff",
                        "#06b6d4",
                        "#eeff00"
                    ],
                    borderWidth: 1,
                    borderColor: "#000000"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: corTexto
                    }
                },
                datalabels: {
                    color: "#ffffff",
                    font: {
                        weight: "bold",
                        size: 10
                    },
                    formatter: function (value, context) {
                        const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                        const porcentagem = ((value / total) * 100).toFixed(1);
                        return porcentagem + "%";
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderizarGastos() {
    listaGastos.innerHTML = "";
    listaCategorias.innerHTML = "";

    const mesAtual = obterMesAtual();

    const gastosFiltrados = gastos.filter((gasto) => {
        if (!mesAtual) return false;
        return extrairMes(gasto.data) === mesAtual;
    });

    let total = 0;
    let totaisPorCategoria = {};

    gastosFiltrados.forEach((gasto) => {
        const valor = Number(gasto.valor) || 0;

        if (gasto.status === "pago") {
            total += valor;
        }

        if (!totaisPorCategoria[gasto.categoria]) {
            totaisPorCategoria[gasto.categoria] = 0;
        }

        totaisPorCategoria[gasto.categoria] += valor;

        const card = document.createElement("div");
        card.classList.add("gasto-item", gasto.status);

        card.innerHTML = `
            <h3>${gasto.descricao}</h3>
            <div class="gasto-info">
                <p><strong>Valor:</strong> ${formatarMoeda(valor)}</p>
                <p><strong>Categoria:</strong> ${gasto.categoria}</p>
                <p><strong>Data:</strong> ${gasto.data}</p>
                <p><strong>Status:</strong> ${gasto.status}</p>
            </div>
        `;

        const containerBotoes = document.createElement("div");
        containerBotoes.classList.add("gasto-acoes");

        const botaoExcluir = document.createElement("button");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.classList.add("btn-excluir");
        containerBotoes.appendChild(botaoExcluir);

        botaoExcluir.onclick = function () {
            if (confirm("Tem certeza que deseja excluir este gasto?")) {
                excluirGasto(gasto.id);
            }
        };

        if (gasto.status === "pendente") {
            const botaoPago = document.createElement("button");
            botaoPago.textContent = "Pendente";
            botaoPago.classList.add("btn-pagar");

            botaoPago.onclick = () => {
                const indexOriginal = gastos.findIndex(g => g.id === gasto.id);
                marcarComoPago(indexOriginal);
            };

            containerBotoes.appendChild(botaoPago);
        } else {
            const botaoPago = document.createElement("button");
            botaoPago.textContent = "Pago";
            botaoPago.classList.add("btn-pago-ok");
            botaoPago.disabled = true;

            containerBotoes.appendChild(botaoPago);
        }

        card.appendChild(containerBotoes);
        listaGastos.appendChild(card);
    });

    renderizarCategorias(totaisPorCategoria);

    const receita = obterReceitaDoMes();
    const saldoFinal = receita - total;

    renderizarGraficoResumo(receita, total);
    renderizarGraficoCategorias(totaisPorCategoria);

    receitaValor.textContent = formatarMoeda(receita);
    totalGasto.textContent = formatarMoeda(total);
    saldo.textContent = formatarMoeda(saldoFinal);
    saldo.style.color = saldoFinal >= 0 ? "green" : "red";
}
function excluirGasto(id) {
    gastos = gastos.filter((g) => g.id !== id);
    salvarDados();
    renderizarGastos();
}

receitaInput.addEventListener("input", () => {
    const mes = obterMesAtual();
    if (!mes) return;

    receitasPorMes[mes] = Number(receitaInput.value) || 0;
    salvarDados();
    renderizarGastos();
});

filtroMes.addEventListener("change", () => {
    atualizarCampoReceita();
    renderizarGastos();
});

gastoForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const descricao = descricaoInput.value.trim();
    const valor = Number(valorInput.value);
    const categoria = categoriaInput.value;
    const data = dataInput.value;

    if (!descricao || !valor || !categoria || !data) {
        alert("Preencha tudo corretamente.");
        return;
    }

    const novoGasto = {
        id: Date.now(),
        descricao: descricao,
        valor: valor,
        categoria: categoria,
        data: data,
        status: "pendente"
    };

    gastos.push(novoGasto);
    salvarDados();

    gastoForm.reset();
    renderizarGastos();
    atualizarCampoReceita();
});

carregarDados();
garantirMesSelecionado();
atualizarCampoReceita();
renderizarGastos();

window.excluirGasto = excluirGasto;
const botaoTema = document.getElementById("toggleTema");

if (botaoTema) {
    if (localStorage.getItem("tema") === "dark") {
        document.body.classList.add("dark");
        botaoTema.textContent = "☀️";
    } else {
        document.body.classList.remove("dark");
        botaoTema.textContent = "🌙";
    }

    botaoTema.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        if (document.body.classList.contains("dark")) {
            localStorage.setItem("tema", "dark");
            botaoTema.textContent = "☀️";
        } else {
            localStorage.setItem("tema", "light");
            botaoTema.textContent = "🌙";
        }

        renderizarGastos();
    });
}