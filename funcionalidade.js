import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_B6zLhTTcsfMJUtC-5qogbTcOhRSt3b0",
    authDomain: "gestor-financeiro-7ed76.firebaseapp.com",
    projectId: "gestor-financeiro-7ed76",
    storageBucket: "gestor-financeiro-7ed76.firebasestorage.app",
    messagingSenderId: "319727089014",
    appId: "1:319727089014:web:5add002603ab5ca1d8f657"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function obterReferenciaDadosUsuario() {
    const user = auth.currentUser;

    if (!user) {
        return null;
    }

    return doc(db, "usuarios", user.uid);
}

const authOverlay = document.getElementById("authOverlay");
const authNome = document.getElementById("authNome");
const authEmail = document.getElementById("authEmail");
const authSenha = document.getElementById("authSenha");
const authMensagem = document.getElementById("authMensagem");
const btnEntrar = document.getElementById("btnEntrar");
const btnCadastrar = document.getElementById("btnCadastrar");
const btnGoogle = document.getElementById("btnGoogle");
const btnSair = document.getElementById("btnSair");
const usuarioLogado = document.getElementById("usuarioLogado");

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
const botaoTema = document.getElementById("toggleTema");

const authTitulo = document.getElementById("authTitulo");
const authSubtitulo = document.getElementById("authSubtitulo");
const campoNome = document.getElementById("campoNome");
const btnAlternarModo = document.getElementById("btnAlternarModo");
const textoAlternancia = document.getElementById("textoAlternancia");

let graficoBarra = null;
let graficoPizza = null;
let gastos = [];
let receitasPorMes = {};
let modoCadastro = false;

function atualizarModoAuth() {
    if (
        !authTitulo ||
        !authSubtitulo ||
        !campoNome ||
        !btnEntrar ||
        !textoAlternancia ||
        !btnAlternarModo
    ) {
        return;
    }

    if (modoCadastro) {
        authTitulo.textContent = "Criar conta";
        authSubtitulo.textContent = "Cadastre-se para começar a usar o sistema";
        campoNome.style.display = "flex";

        btnEntrar.textContent = "Criar conta";
        btnEntrar.classList.remove("btn-entrar");
        btnEntrar.classList.add("btn-cadastrar");

        textoAlternancia.textContent = "Já tem conta?";
        btnAlternarModo.textContent = "Entrar";
    } else {
        authTitulo.textContent = "Bem-vindo";
        authSubtitulo.textContent = "Entre para acessar seu controle financeiro";
        campoNome.style.display = "none";

        btnEntrar.textContent = "Entrar";
        btnEntrar.classList.remove("btn-cadastrar");
        btnEntrar.classList.add("btn-entrar");

        textoAlternancia.textContent = "Ainda não tem conta?";
        btnAlternarModo.textContent = "Criar agora";
    }
}

function mostrarMensagemAuth(texto, tipo = "erro") {
    if (!authMensagem) return;
    authMensagem.textContent = texto;
    authMensagem.style.color = tipo === "sucesso" ? "green" : "red";
}

function limparMensagemAuth() {
    if (!authMensagem) return;
    authMensagem.textContent = "";
}

function mostrarOverlay() {
    if (!authOverlay) return;
    authOverlay.style.display = "flex";
    document.body.classList.add("auth-ativo");
}

function esconderOverlay() {
    if (!authOverlay) return;
    authOverlay.style.display = "none";
    document.body.classList.remove("auth-ativo");
}

function traduzirErroAuth(codigo) {
    switch (codigo) {
        case "auth/invalid-email":
            return "E-mail inválido.";
        case "auth/missing-password":
            return "Digite a senha.";
        case "auth/weak-password":
            return "A senha precisa ter pelo menos 6 caracteres.";
        case "auth/email-already-in-use":
            return "Este e-mail já está cadastrado.";
        case "auth/invalid-credential":
            return "E-mail ou senha incorretos.";
        case "auth/user-not-found":
            return "Usuário não encontrado.";
        case "auth/wrong-password":
            return "Senha incorreta.";
        case "auth/popup-closed-by-user":
            return "A janela do Google foi fechada antes do login.";
        case "auth/cancelled-popup-request":
            return "Outra janela de login já estava aberta.";
        case "auth/too-many-requests":
            return "Muitas tentativas. Tente novamente mais tarde.";
        default:
            return "Não foi possível autenticar. Tente novamente.";
    }
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function extrairMes(data) {
    if (!data) return "";
    return data.slice(0, 7);
}

function garantirMesSelecionado() {
    if (!filtroMes) return;

    if (!filtroMes.value) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        filtroMes.value = `${ano}-${mes}`;
    }
}

function obterMesAtual() {
    return filtroMes ? filtroMes.value : "";
}

function obterReceitaDoMes() {
    const mes = obterMesAtual();
    return Number(receitasPorMes[mes]) || 0;
}

function atualizarCampoReceita() {
    if (!receitaInput) return;
    const mes = obterMesAtual();
    receitaInput.value = receitasPorMes[mes] ?? "";
}

function temaEscuroAtivo() {
    return document.body.classList.contains("dark");
}

async function salvarDadosNoFirebase() {
    try {
        const referenciaDados = obterReferenciaDadosUsuario();

        if (!referenciaDados) {
            console.log("Nenhum usuário logado para salvar os dados.");
            return;
        }

        await setDoc(referenciaDados, {
            gastos,
            receitasPorMes
        });

        console.log("Dados salvos no Firestore com sucesso");
    } catch (erro) {
        console.error("Erro ao salvar dados no Firestore:", erro);
    }
}

async function carregarDadosDoFirebase() {
    try {
        const referenciaDados = obterReferenciaDadosUsuario();

        if (!referenciaDados) {
            console.log("Nenhum usuário logado para carregar os dados.");
            return;
        }

        const snapshot = await getDoc(referenciaDados);

        if (snapshot.exists()) {
            const dados = snapshot.data();
            gastos = Array.isArray(dados.gastos) ? dados.gastos : [];
            receitasPorMes =
                dados.receitasPorMes && typeof dados.receitasPorMes === "object"
                    ? dados.receitasPorMes
                    : {};
        } else {
            gastos = [];
            receitasPorMes = {};
        }

        atualizarCampoReceita();
        renderizarGastos();
        console.log("Dados carregados do Firestore com sucesso");
    } catch (erro) {
        console.error("Erro ao carregar dados do Firestore:", erro);
        renderizarGastos();
    }
}

async function marcarComoPago(index) {
    if (index < 0 || index >= gastos.length) return;

    gastos[index].status = "pago";
    await salvarDadosNoFirebase();
    renderizarGastos();
}

async function excluirGasto(id) {
    gastos = gastos.filter((g) => g.id !== id);
    await salvarDadosNoFirebase();
    renderizarGastos();
}

function renderizarCategorias(totaisPorCategoria) {
    if (!listaCategorias) return;

    listaCategorias.innerHTML = "";

    const categorias = Object.entries(totaisPorCategoria);
    if (categorias.length === 0) return;

    const totalGeral = categorias.reduce((acc, [, valor]) => acc + valor, 0);
    categorias.sort((a, b) => b[1] - a[1]);

    categorias.forEach(([categoria, valor]) => {
        const porcentagem =
            totalGeral > 0 ? ((valor / totalGeral) * 100).toFixed(1) : "0.0";

        const li = document.createElement("li");
        li.innerHTML = `
      <div class="categoria-topo">
        <span>${categoria}</span>
        <span>${formatarMoeda(valor)}</span>
      </div>
      <div class="categoria-barra">
        <div class="categoria-barra-fill" style="width: ${porcentagem}%"></div>
      </div>
    `;

        listaCategorias.appendChild(li);
    });
}

function renderizarGraficoResumo(receita, total) {
    const modoEscuro = temaEscuroAtivo();
    const corTexto = modoEscuro ? "#f9fafb" : "#1f2937";
    const corGrade = modoEscuro
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.08)";

    if (!graficoResumo || typeof Chart === "undefined") return;

    if (graficoBarra) {
        graficoBarra.destroy();
        graficoBarra = null;
    }

    const porcentagemGasta =
        receita > 0 ? ((total / receita) * 100).toFixed(1) : 0;

    const ctx = graficoResumo.getContext("2d");

    graficoBarra = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Receita", `Gasto (${porcentagemGasta}%)`],
            datasets: [
                {
                    label: "Valores do mês",
                    data: [receita, total],
                    backgroundColor: ["rgb(4, 0, 255)", "rgb(141, 0, 0)"],
                    borderColor: "#000000",
                    borderWidth: 2
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
                    ticks: { color: corTexto },
                    grid: { color: corGrade }
                },
                y: {
                    ticks: { color: corTexto },
                    grid: { color: corGrade }
                }
            }
        }
    });
}

function renderizarGraficoCategorias(totaisPorCategoria) {
    const modoEscuro = temaEscuroAtivo();
    const corTexto = modoEscuro ? "#f9fafb" : "#1f2937";

    if (!graficoCategorias || typeof Chart === "undefined") return;

    if (graficoPizza) {
        graficoPizza.destroy();
        graficoPizza = null;
    }

    const categorias = Object.keys(totaisPorCategoria);
    const valores = Object.values(totaisPorCategoria);

    if (categorias.length === 0) return;

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
                        const porcentagem =
                            total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                        return porcentagem + "%";
                    }
                }
            }
        },
        plugins: typeof ChartDataLabels !== "undefined" ? [ChartDataLabels] : []
    });
}

function renderizarGastos() {
    if (!listaGastos || !listaCategorias || !receitaValor || !totalGasto || !saldo) {
        return;
    }

    listaGastos.innerHTML = "";
    listaCategorias.innerHTML = "";

    const mesAtual = obterMesAtual();

    const gastosFiltrados = gastos.filter((gasto) => {
        if (!mesAtual) return false;
        return extrairMes(gasto.data) === mesAtual;
    });

    let total = 0;
    const totaisPorCategoria = {};

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
        botaoExcluir.onclick = async function () {
            if (confirm("Tem certeza que deseja excluir este gasto?")) {
                await excluirGasto(gasto.id);
            }
        };
        containerBotoes.appendChild(botaoExcluir);

        if (gasto.status === "pendente") {
            const botaoPago = document.createElement("button");
            botaoPago.textContent = "Pendente";
            botaoPago.classList.add("btn-pagar");
            botaoPago.onclick = async () => {
                const indexOriginal = gastos.findIndex((g) => g.id === gasto.id);
                await marcarComoPago(indexOriginal);
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

if (btnAlternarModo) {
    btnAlternarModo.addEventListener("click", () => {
        modoCadastro = !modoCadastro;
        limparMensagemAuth();
        atualizarModoAuth();
    });
}

if (receitaInput) {
    receitaInput.addEventListener("input", async function () {
        const mes = obterMesAtual();
        receitasPorMes[mes] = parseFloat(receitaInput.value) || 0;
        await salvarDadosNoFirebase();
        renderizarGastos();
    });
}

if (filtroMes) {
    filtroMes.addEventListener("change", function () {
        atualizarCampoReceita();
        renderizarGastos();
    });
}

if (gastoForm) {
    gastoForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const descricao = descricaoInput ? descricaoInput.value.trim() : "";
        const valor = valorInput ? Number(valorInput.value) : 0;
        const categoria = categoriaInput ? categoriaInput.value : "";
        const data = dataInput ? dataInput.value : "";

        if (!descricao || !valor || !categoria || !data) {
            alert("Preencha tudo corretamente.");
            return;
        }

        const novoGasto = {
            id: Date.now(),
            descricao,
            valor,
            categoria,
            data,
            status: "pendente"
        };

        gastos.push(novoGasto);
        await salvarDadosNoFirebase();

        gastoForm.reset();
        renderizarGastos();
        atualizarCampoReceita();
    });
}

if (btnEntrar) {
    btnEntrar.addEventListener("click", async function () {
        const nome = authNome ? authNome.value.trim() : "";
        const email = authEmail ? authEmail.value.trim() : "";
        const senha = authSenha ? authSenha.value.trim() : "";

        limparMensagemAuth();

        if (!email || !senha) {
            mostrarMensagemAuth("Preencha e-mail e senha.");
            return;
        }

        try {
            if (modoCadastro) {
                if (!nome) {
                    mostrarMensagemAuth("Preencha o nome.");
                    return;
                }

                if (senha.length < 6) {
                    mostrarMensagemAuth("A senha deve ter pelo menos 6 caracteres.");
                    return;
                }

                const credencial = await createUserWithEmailAndPassword(auth, email, senha);

                await updateProfile(cred.user, {
                    displayName: nome
                });
                await cred.user.reload();

                mostrarMensagemAuth("Conta criada com sucesso.", "sucesso");
            } else {
                await signInWithEmailAndPassword(auth, email, senha);
            }
        } catch (erro) {
            console.error("Erro na autenticação:", erro);
            mostrarMensagemAuth(traduzirErroAuth(erro.code));
        }
    });
}
if (btnGoogle) {
    btnGoogle.addEventListener("click", async function () {
        limparMensagemAuth();

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (erro) {
            console.error("Erro no login com Google:", erro);
            mostrarMensagemAuth(traduzirErroAuth(erro.code));
        }
    });
}

if (btnSair) {
    btnSair.addEventListener("click", async () => {
        try {
            await signOut(auth);
        } catch (erro) {
            console.error("Erro ao sair:", erro);
        }
    });
}

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

garantirMesSelecionado();
atualizarCampoReceita();
atualizarModoAuth();
mostrarOverlay();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        await user.reload();

        esconderOverlay();

        const usuarioAtualizado = auth.currentUser;

        const nomeUsuario =
            usuarioAtualizado?.displayName && usuarioAtualizado.displayName.trim() !== ""
                ? usuarioAtualizado.displayName
                : usuarioAtualizado?.email || "Usuário";

        if (usuarioLogado) {
            usuarioLogado.textContent = `Olá, ${nomeUsuario}`;
        }

        await carregarDadosDoFirebase();
    } else {
        mostrarOverlay();

        if (usuarioLogado) {
            usuarioLogado.textContent = "";
        }

        gastos = [];
        receitasPorMes = {};
        atualizarCampoReceita();
        renderizarGastos();
    }
});
window.excluirGasto = excluirGasto;
