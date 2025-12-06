// Sistema de Ponto Eletrônico
class PontoEletronico {
    constructor() {
        this.colaboradores = this.carregarDados('colaboradores') || [];
        this.registros = this.carregarDados('registros') || [];
        this.colaboradorEditando = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.carregarDataAtual();
        this.atualizarSelects();
        this.carregarUltimosRegistros();
        this.carregarListaColaboradores();
    }

    setupEventListeners() {
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.mostrarAba(tab);
            });
        });

        // Registrar ponto
        document.getElementById('btn-registrar').addEventListener('click', () => {
            this.registrarPonto();
        });

        // Colaboradores
        document.getElementById('btn-novo-colaborador').addEventListener('click', () => {
            this.mostrarFormColaborador();
        });

        document.getElementById('btn-salvar-colaborador').addEventListener('click', () => {
            this.salvarColaborador();
        });

        document.getElementById('btn-cancelar-colaborador').addEventListener('click', () => {
            this.cancelarFormColaborador();
        });

        // Filtros
        document.getElementById('btn-filtrar').addEventListener('click', () => {
            this.filtrarHistorico();
        });

        document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
            this.limparFiltros();
        });

        // Relatórios
        document.getElementById('btn-gerar-relatorio').addEventListener('click', () => {
            this.gerarRelatorio();
        });
    }

    mostrarAba(tab) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(tab).classList.add('active');
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        if (tab === 'historico') {
            this.carregarHistorico();
        }
    }

    carregarDataAtual() {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('data-registro').value = hoje;
        document.getElementById('hora-registro').value = new Date().toTimeString().slice(0, 5);
    }

    atualizarSelects() {
        const selectRegistro = document.getElementById('colaborador-select');
        const selectFiltro = document.getElementById('filtro-colaborador');
        const selectRelatorio = document.getElementById('relatorio-colaborador');

        [selectRegistro, selectFiltro, selectRelatorio].forEach(select => {
            select.innerHTML = '<option value="">Selecione um colaborador</option>';
            this.colaboradores.forEach(colab => {
                const option = document.createElement('option');
                option.value = colab.id;
                option.textContent = colab.nome;
                select.appendChild(option);
            });
        });
    }

    registrarPonto() {
        const colaboradorId = document.getElementById('colaborador-select').value;
        const tipo = document.getElementById('tipo-registro').value;
        const data = document.getElementById('data-registro').value;
        const hora = document.getElementById('hora-registro').value;
        const observacao = document.getElementById('observacao').value;

        if (!colaboradorId) {
            alert('Por favor, selecione um colaborador.');
            return;
        }

        const colaborador = this.colaboradores.find(c => c.id === colaboradorId);
        const registro = {
            id: Date.now(),
            colaboradorId: colaboradorId,
            colaboradorNome: colaborador.nome,
            tipo: tipo,
            data: data,
            hora: hora,
            observacao: observacao,
            timestamp: new Date(`${data}T${hora}`).getTime()
        };

        this.registros.push(registro);
        this.salvarDados('registros', this.registros);
        this.carregarUltimosRegistros();
        
        // Limpar formulário
        document.getElementById('observacao').value = '';
        this.carregarDataAtual();

        alert('Ponto registrado com sucesso!');
    }

    carregarUltimosRegistros() {
        const container = document.getElementById('ultimos-registros');
        const ultimos = this.registros
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        if (ultimos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum registro encontrado</div>';
            return;
        }

        container.innerHTML = ultimos.map(reg => this.criarItemRegistro(reg)).join('');
    }

    criarItemRegistro(registro) {
        const tipoLabels = {
            'entrada': 'Entrada',
            'saida': 'Saída',
            'entrada-almoco': 'Entrada Almoço',
            'saida-almoco': 'Saída Almoço'
        };

        return `
            <div class="registro-item ${registro.tipo}">
                <div class="registro-info">
                    <strong>${registro.colaboradorNome}</strong>
                    <span>${this.formatarData(registro.data)} às ${registro.hora}</span>
                    ${registro.observacao ? `<span style="display: block; margin-top: 5px; font-style: italic;">${registro.observacao}</span>` : ''}
                </div>
                <span class="registro-tipo ${registro.tipo}">${tipoLabels[registro.tipo]}</span>
            </div>
        `;
    }

    mostrarFormColaborador(colaborador = null) {
        const form = document.getElementById('form-colaborador');
        form.style.display = 'block';
        this.colaboradorEditando = colaborador;

        if (colaborador) {
            document.getElementById('nome-colaborador').value = colaborador.nome;
            document.getElementById('cpf-colaborador').value = colaborador.cpf;
            document.getElementById('cargo-colaborador').value = colaborador.cargo;
            document.getElementById('departamento-colaborador').value = colaborador.departamento;
            document.getElementById('jornada-colaborador').value = colaborador.jornada;
        } else {
            form.querySelector('form')?.reset();
            document.getElementById('nome-colaborador').value = '';
            document.getElementById('cpf-colaborador').value = '';
            document.getElementById('cargo-colaborador').value = '';
            document.getElementById('departamento-colaborador').value = '';
            document.getElementById('jornada-colaborador').value = '8';
        }
    }

    salvarColaborador() {
        const nome = document.getElementById('nome-colaborador').value.trim();
        const cpf = document.getElementById('cpf-colaborador').value.trim();
        const cargo = document.getElementById('cargo-colaborador').value.trim();
        const departamento = document.getElementById('departamento-colaborador').value.trim();
        const jornada = parseFloat(document.getElementById('jornada-colaborador').value);

        if (!nome || !cpf || !cargo || !departamento) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (this.colaboradorEditando) {
            // Editar
            const index = this.colaboradores.findIndex(c => c.id === this.colaboradorEditando.id);
            this.colaboradores[index] = {
                ...this.colaboradores[index],
                nome,
                cpf,
                cargo,
                departamento,
                jornada
            };
        } else {
            // Novo
            const novoColaborador = {
                id: Date.now(),
                nome,
                cpf,
                cargo,
                departamento,
                jornada,
                dataCadastro: new Date().toISOString().split('T')[0]
            };
            this.colaboradores.push(novoColaborador);
        }

        this.salvarDados('colaboradores', this.colaboradores);
        this.cancelarFormColaborador();
        this.carregarListaColaboradores();
        this.atualizarSelects();
        alert('Colaborador salvo com sucesso!');
    }

    cancelarFormColaborador() {
        document.getElementById('form-colaborador').style.display = 'none';
        this.colaboradorEditando = null;
    }

    carregarListaColaboradores() {
        const container = document.getElementById('lista-colaboradores');
        
        if (this.colaboradores.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum colaborador cadastrado</div>';
            return;
        }

        container.innerHTML = this.colaboradores.map(colab => `
            <div class="colaborador-card">
                <h4>${colab.nome}</h4>
                <p><strong>CPF:</strong> ${colab.cpf}</p>
                <p><strong>Cargo:</strong> ${colab.cargo}</p>
                <p><strong>Departamento:</strong> ${colab.departamento}</p>
                <p><strong>Jornada:</strong> ${colab.jornada}h/dia</p>
                <div class="colaborador-actions">
                    <button class="btn btn-primary btn-small" onclick="app.editarColaborador(${colab.id})">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="app.excluirColaborador(${colab.id})">Excluir</button>
                </div>
            </div>
        `).join('');
    }

    editarColaborador(id) {
        const colaborador = this.colaboradores.find(c => c.id === id);
        if (colaborador) {
            this.mostrarFormColaborador(colaborador);
            document.getElementById('form-colaborador').scrollIntoView({ behavior: 'smooth' });
        }
    }

    excluirColaborador(id) {
        if (confirm('Tem certeza que deseja excluir este colaborador?')) {
            this.colaboradores = this.colaboradores.filter(c => c.id !== id);
            this.registros = this.registros.filter(r => r.colaboradorId !== id);
            this.salvarDados('colaboradores', this.colaboradores);
            this.salvarDados('registros', this.registros);
            this.carregarListaColaboradores();
            this.atualizarSelects();
            alert('Colaborador excluído com sucesso!');
        }
    }

    filtrarHistorico() {
        const colaboradorId = document.getElementById('filtro-colaborador').value;
        const dataInicio = document.getElementById('filtro-data-inicio').value;
        const dataFim = document.getElementById('filtro-data-fim').value;

        let filtrados = [...this.registros];

        if (colaboradorId) {
            filtrados = filtrados.filter(r => r.colaboradorId === colaboradorId);
        }

        if (dataInicio) {
            filtrados = filtrados.filter(r => r.data >= dataInicio);
        }

        if (dataFim) {
            filtrados = filtrados.filter(r => r.data <= dataFim);
        }

        this.exibirHistorico(filtrados.sort((a, b) => b.timestamp - a.timestamp));
    }

    limparFiltros() {
        document.getElementById('filtro-colaborador').value = '';
        document.getElementById('filtro-data-inicio').value = '';
        document.getElementById('filtro-data-fim').value = '';
        this.carregarHistorico();
    }

    carregarHistorico() {
        this.exibirHistorico(this.registros.sort((a, b) => b.timestamp - a.timestamp));
    }

    exibirHistorico(registros) {
        const container = document.getElementById('historico-registros');
        
        if (registros.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum registro encontrado</div>';
            return;
        }

        container.innerHTML = registros.map(reg => this.criarItemRegistro(reg)).join('');
    }

    gerarRelatorio() {
        const colaboradorId = document.getElementById('relatorio-colaborador').value;
        const mesAno = document.getElementById('relatorio-mes').value;

        if (!colaboradorId || !mesAno) {
            alert('Por favor, selecione um colaborador e um mês/ano.');
            return;
        }

        const colaborador = this.colaboradores.find(c => c.id === colaboradorId);
        const [ano, mes] = mesAno.split('-');

        const registrosMes = this.registros.filter(r => {
            if (r.colaboradorId !== colaboradorId) return false;
            const [rAno, rMes] = r.data.split('-');
            return rAno === ano && rMes === mes;
        });

        if (registrosMes.length === 0) {
            document.getElementById('relatorio-resultado').innerHTML = 
                '<div class="empty-state">Nenhum registro encontrado para este período</div>';
            return;
        }

        // Calcular estatísticas
        const diasTrabalhados = this.calcularDiasTrabalhados(registrosMes);
        const horasTrabalhadas = this.calcularHorasTrabalhadas(registrosMes, colaborador.jornada);
        const horasEsperadas = diasTrabalhados * colaborador.jornada;
        const saldoHoras = horasTrabalhadas - horasEsperadas;

        // Agrupar por dia
        const registrosPorDia = {};
        registrosMes.forEach(reg => {
            if (!registrosPorDia[reg.data]) {
                registrosPorDia[reg.data] = [];
            }
            registrosPorDia[reg.data].push(reg);
        });

        let html = `
            <div class="relatorio-card">
                <div class="relatorio-header">
                    <div>
                        <h3>Relatório de ${colaborador.nome}</h3>
                        <p>${this.formatarMesAno(mesAno)}</p>
                    </div>
                </div>
                <div class="relatorio-stats">
                    <div class="stat-card">
                        <h4>Dias Trabalhados</h4>
                        <div class="stat-value">${diasTrabalhados}</div>
                    </div>
                    <div class="stat-card">
                        <h4>Horas Trabalhadas</h4>
                        <div class="stat-value">${horasTrabalhadas.toFixed(2)}h</div>
                    </div>
                    <div class="stat-card">
                        <h4>Horas Esperadas</h4>
                        <div class="stat-value">${horasEsperadas.toFixed(2)}h</div>
                    </div>
                    <div class="stat-card">
                        <h4>Saldo de Horas</h4>
                        <div class="stat-value" style="color: ${saldoHoras >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">
                            ${saldoHoras >= 0 ? '+' : ''}${saldoHoras.toFixed(2)}h
                        </div>
                    </div>
                </div>
            </div>
            <div class="relatorio-card">
                <h3>Detalhamento por Dia</h3>
                ${Object.keys(registrosPorDia).sort().map(data => {
                    const regs = registrosPorDia[data].sort((a, b) => a.hora.localeCompare(b.hora));
                    return `
                        <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-color); border-radius: 8px;">
                            <strong>${this.formatarData(data)}</strong>
                            <div style="margin-top: 10px;">
                                ${regs.map(r => `
                                    <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid var(--border-color);">
                                        <span>${this.getTipoLabel(r.tipo)}</span>
                                        <span>${r.hora}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        document.getElementById('relatorio-resultado').innerHTML = html;
    }

    calcularDiasTrabalhados(registros) {
        const dias = new Set(registros.map(r => r.data));
        return dias.size;
    }

    calcularHorasTrabalhadas(registros, jornada) {
        const registrosPorDia = {};
        registros.forEach(reg => {
            if (!registrosPorDia[reg.data]) {
                registrosPorDia[reg.data] = [];
            }
            registrosPorDia[reg.data].push(reg);
        });

        let totalHoras = 0;
        Object.keys(registrosPorDia).forEach(data => {
            const regs = registrosPorDia[data].sort((a, b) => a.timestamp - b.timestamp);
            let entrada = null;
            let saida = null;
            let entradaAlmoco = null;
            let saidaAlmoco = null;

            regs.forEach(reg => {
                if (reg.tipo === 'entrada') entrada = reg;
                if (reg.tipo === 'saida') saida = reg;
                if (reg.tipo === 'entrada-almoco') entradaAlmoco = reg;
                if (reg.tipo === 'saida-almoco') saidaAlmoco = reg;
            });

            if (entrada && saida) {
                const inicio = new Date(`${entrada.data}T${entrada.hora}`);
                const fim = new Date(`${saida.data}T${saida.hora}`);
                let horas = (fim - inicio) / (1000 * 60 * 60);

                if (entradaAlmoco && saidaAlmoco) {
                    const inicioAlmoco = new Date(`${entradaAlmoco.data}T${entradaAlmoco.hora}`);
                    const fimAlmoco = new Date(`${saidaAlmoco.data}T${saidaAlmoco.hora}`);
                    const horasAlmoco = (fimAlmoco - inicioAlmoco) / (1000 * 60 * 60);
                    horas -= horasAlmoco;
                }

                totalHoras += Math.max(0, horas);
            }
        });

        return totalHoras;
    }

    getTipoLabel(tipo) {
        const labels = {
            'entrada': 'Entrada',
            'saida': 'Saída',
            'entrada-almoco': 'Entrada Almoço',
            'saida-almoco': 'Saída Almoço'
        };
        return labels[tipo] || tipo;
    }

    formatarData(data) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    formatarMesAno(mesAno) {
        const [ano, mes] = mesAno.split('-');
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${meses[parseInt(mes) - 1]} de ${ano}`;
    }

    salvarDados(chave, dados) {
        localStorage.setItem(`ponto_${chave}`, JSON.stringify(dados));
    }

    carregarDados(chave) {
        const dados = localStorage.getItem(`ponto_${chave}`);
        return dados ? JSON.parse(dados) : null;
    }
}

// Inicializar aplicação
const app = new PontoEletronico();

