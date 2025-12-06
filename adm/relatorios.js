// Sistema de Relatórios - Colaboradores e Registros
class RelatoriosColaboradores {
    constructor() {
        this.colaboradores = [];
        this.registros = [];
        this.filtros = {
            colaborador: '',
            dataInicio: '',
            dataFim: ''
        };
        this.init();
    }

    init() {
        this.carregarDados();
        this.setupEventListeners();
        this.carregarRelatorios();
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('btn-filtrar').addEventListener('click', () => {
            this.aplicarFiltros();
        });

        document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
            this.limparFiltros();
        });

        // Modal de foto
        document.getElementById('close-modal').addEventListener('click', () => {
            document.getElementById('modal-foto').classList.remove('active');
        });

        document.getElementById('modal-foto').addEventListener('click', (e) => {
            if (e.target.id === 'modal-foto') {
                document.getElementById('modal-foto').classList.remove('active');
            }
        });
    }

    carregarDados() {
        // Carregar colaboradores
        const colaboradoresSenhas = JSON.parse(localStorage.getItem('colaboradores_senhas') || '[]');
        
        this.colaboradores = colaboradoresSenhas.map(colab => {
            const dados = JSON.parse(localStorage.getItem(`colaborador_${colab.nome}`) || '{}');
            return {
                nome: colab.nome,
                senha: colab.senha,
                ...dados
            };
        });

        // Carregar registros
        this.registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');

        // Popular select de filtro
        this.popularFiltroColaboradores();
    }

    popularFiltroColaboradores() {
        const select = document.getElementById('filtro-colaborador');
        select.innerHTML = '<option value="">Todos os colaboradores</option>';
        
        this.colaboradores.forEach(colab => {
            const option = document.createElement('option');
            option.value = colab.nome;
            option.textContent = colab.nome;
            select.appendChild(option);
        });
    }

    aplicarFiltros() {
        this.filtros.colaborador = document.getElementById('filtro-colaborador').value;
        this.filtros.dataInicio = document.getElementById('filtro-data-inicio').value;
        this.filtros.dataFim = document.getElementById('filtro-data-fim').value;
        
        this.carregarRelatorios();
    }

    limparFiltros() {
        document.getElementById('filtro-colaborador').value = '';
        document.getElementById('filtro-data-inicio').value = '';
        document.getElementById('filtro-data-fim').value = '';
        
        this.filtros = {
            colaborador: '',
            dataInicio: '',
            dataFim: ''
        };
        
        this.carregarRelatorios();
    }

    carregarRelatorios() {
        const container = document.getElementById('lista-relatorios');
        
        // Filtrar colaboradores
        let colaboradoresFiltrados = [...this.colaboradores];
        if (this.filtros.colaborador) {
            colaboradoresFiltrados = colaboradoresFiltrados.filter(c => c.nome === this.filtros.colaborador);
        }

        if (colaboradoresFiltrados.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <div class="empty-state">
                        <span>👥</span>
                        <p>Nenhum colaborador encontrado</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = colaboradoresFiltrados.map(colab => {
            const registrosColab = this.registros
                .filter(r => r.colaboradorNome === colab.nome)
                .filter(r => {
                    if (this.filtros.dataInicio && r.data < this.filtros.dataInicio) return false;
                    if (this.filtros.dataFim && r.data > this.filtros.dataFim) return false;
                    return true;
                })
                .sort((a, b) => b.timestamp - a.timestamp);

            const stats = this.calcularEstatisticas(registrosColab);

            return `
                <div class="colaborador-card-relatorio">
                    <div class="colaborador-header">
                        <img src="${colab.foto || ''}" alt="${colab.nome}" class="colaborador-foto-relatorio" 
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3E${colab.nome.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E'">
                        <div class="colaborador-info-relatorio">
                            <h3>${colab.nome}</h3>
                            <p><strong>Função:</strong> ${colab.funcao || 'Não informada'}</p>
                            <p><strong>Total de Registros:</strong> ${registrosColab.length}</p>
                        </div>
                    </div>

                    <div class="stats-colaborador">
                        <div class="stat-item">
                            <h4>Entradas</h4>
                            <div class="stat-value">${stats.entradas}</div>
                        </div>
                        <div class="stat-item">
                            <h4>Saídas</h4>
                            <div class="stat-value">${stats.saidas}</div>
                        </div>
                        <div class="stat-item">
                            <h4>Último Registro</h4>
                            <div class="stat-value" style="font-size: 1rem;">${stats.ultimoRegistro || 'N/A'}</div>
                        </div>
                    </div>

                    ${registrosColab.length > 0 ? `
                        <table class="registros-tabela">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Hora</th>
                                    <th>Tipo</th>
                                    <th>Foto</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${registrosColab.map(reg => `
                                    <tr>
                                        <td>${this.formatarData(reg.data)}</td>
                                        <td>${reg.hora}</td>
                                        <td>
                                            <span class="badge-tipo ${reg.tipo === 'entrada' ? 'badge-entrada' : 'badge-saida'}">
                                                ${reg.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                                            </span>
                                        </td>
                                        <td>
                                            ${reg.foto ? `
                                                <img src="${reg.foto}" alt="Foto do registro" class="foto-registro" 
                                                     onclick="relatorios.mostrarFoto('${reg.foto}')">
                                            ` : 'Sem foto'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <div class="empty-registros">
                            <p>Nenhum registro encontrado para este colaborador no período selecionado.</p>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }

    calcularEstatisticas(registros) {
        const entradas = registros.filter(r => r.tipo === 'entrada').length;
        const saidas = registros.filter(r => r.tipo === 'saida').length;
        
        let ultimoRegistro = 'N/A';
        if (registros.length > 0) {
            const ultimo = registros[0];
            ultimoRegistro = `${this.formatarData(ultimo.data)} ${ultimo.hora}`;
        }

        return {
            entradas,
            saidas,
            ultimoRegistro
        };
    }

    formatarData(data) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    mostrarFoto(foto) {
        document.getElementById('foto-modal').src = foto;
        document.getElementById('modal-foto').classList.add('active');
    }
}

// Inicializar aplicação de relatórios
const relatorios = new RelatoriosColaboradores();

