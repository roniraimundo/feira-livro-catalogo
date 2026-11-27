'use strict';

const porPagina = 30;
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const camposBusca = ['titulo', 'autores', 'editora', 'codigo'];
const obter = id => document.getElementById(id);
const normalizar = valor => (valor ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
let catalogo = [];
let resultados = [];
let pagina = 1;

function elemento(tag, classe, texto) {
  const no = document.createElement(tag);
  no.className = classe;
  no.textContent = texto;
  return no;
}

function cartao(item) {
  const livro = elemento('article', 'book', '');
  livro.append(elemento('div', 'code', 'CÓDIGO ' + (item.codigo?.trim() ? item.codigo : '—')));
  livro.append(elemento('div', 'title', item.titulo?.trim() ? item.titulo : '—'));

  for (const [rotulo, valor] of [
    ['Gênero', item.genero_feira_clarim],
    ['Autores', item.autores],
    ['Editora', item.editora],
  ]) {
    if (!valor?.trim()) continue;
    const campo = elemento('div', 'meta', '');
    campo.append(elemento('b', '', rotulo + ': '), valor);
    livro.append(campo);
  }

  const rodape = elemento('div', 'bottom', '');
  const preco = elemento('div', '', '');
  preco.append(
    elemento('div', 'price-label', 'PREÇO POR'),
    elemento('div', 'price', item.preco_por?.trim() ? moeda.format(Number(item.preco_por)) : '—'),
  );
  rodape.append(preco);
  livro.append(rodape);
  return livro;
}

function renderizar() {
  const total = resultados.length;
  const inicio = (pagina - 1) * porPagina;
  const cards = resultados.slice(inicio, inicio + porPagina).map(({ item }) => cartao(item));
  if (!total) cards.push(elemento('div', 'empty', 'Nenhum livro disponível encontrado.'));
  obter('lista').replaceChildren(...cards);
  obter('status').textContent = total + ' exemplar(es) disponível(is)';
  obter('pagina').textContent = 'Página ' + pagina + ' de ' + Math.max(1, Math.ceil(total / porPagina));
  obter('anterior').disabled = pagina === 1;
  obter('proximo').disabled = inicio + porPagina >= total;
}

function mudarPagina(delta) {
  pagina += delta;
  renderizar();
  window.scrollTo({ top: 0 });
}

obter('pesquisa').addEventListener('submit', evento => {
  evento.preventDefault();
  if (obter('busca').disabled) return;
  const termo = normalizar(obter('busca').value.trim());
  resultados = catalogo.filter(({ campos }) => campos.some(campo => campo.includes(termo)));
  pagina = 1;
  renderizar();
});

obter('anterior').addEventListener('click', () => mudarPagina(-1));
obter('proximo').addEventListener('click', () => mudarPagina(1));

async function carregar() {
  try {
    const resposta = await fetch('./catalogo.json');
    if (!resposta.ok) throw new Error('Catálogo indisponível');
    const dados = await resposta.json();
    catalogo = dados.itens.map(item => ({
      item,
      campos: camposBusca.map(campo => normalizar(item[campo])),
    }));
    resultados = catalogo;
    renderizar();
    obter('atualizacao').textContent = 'Catálogo atualizado em: ' + dados.atualizado_em;
    obter('atualizacao').hidden = false;
    obter('busca').disabled = false;
    obter('pesquisar').disabled = false;
    document.querySelector('.pagination').hidden = false;
  } catch {
    obter('status').textContent = 'Não foi possível carregar o catálogo. Recarregue a página ou verifique se catalogo.json está disponível no servidor.';
  }
}

carregar();
