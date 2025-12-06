// Sistema Administrativo - Cadastro de Colaboradores
class AdminColaboradores {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.carregarListaColaboradores();
        this.setupPreviewFoto();
    }

    setupEventListeners() {
        // Formulário
        document.getElementById('form-colaborador').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarColaborador();
        });

        // Botão limpar
        document.getElementById('btn-limpar-form').addEventListener('click', () => {
            this.limparFormulario();
        });

        // Botão atualizar lista
        document.getElementById('btn-atualizar-lista').addEventListener('click', () => {
            this.carregarListaColaboradores();
        });
    }

    setupPreviewFoto() {
        const inputFoto = document.getElementById('foto-colaborador');
        inputFoto.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.getElementById('preview-foto');
                    const placeholder = document.getElementById('preview-placeholder');
                    preview.src = event.target.result;
                    preview.style.display = 'block';
                    placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    salvarColaborador() {
        const nome = document.getElementById('nome-colaborador').value.trim();
        const funcao = document.getElementById('funcao-colaborador').value.trim();
        const senha = document.getElementById('senha-colaborador').value.trim();
        const fotoInput = document.getElementById('foto-colaborador');

        // Validações
        if (!nome || !funcao || !senha) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (!/^\d+$/.test(senha)) {
            alert('A senha deve conter apenas números.');
            return;
        }

        if (senha.length < 4 || senha.length > 10) {
            alert('A senha deve ter entre 4 e 10 dígitos.');
            return;
        }

        if (!fotoInput.files[0]) {
            alert('Por favor, selecione uma foto de perfil.');
            return;
        }

        // Verificar se senha já existe
        const colaboradoresSenhas = JSON.parse(localStorage.getItem('colaboradores_senhas') || '[]');
        if (colaboradoresSenhas.find(c => c.senha === senha && c.nome !== nome)) {
            alert('Esta senha já está sendo usada por outro colaborador.');
            return;
        }

        // Ler foto como base64
        const reader = new FileReader();
        reader.onload = (event) => {
            const fotoBase64 = event.target.result;

            // Normalizar nome do colaborador (remover acentos e espaços para nome da pasta)
            const nomeNormalizado = this.normalizarNome(nome);

            // Dados do colaborador (sem senha)
            const dadosColaborador = {
                nome: nome,
                funcao: funcao,
                foto: fotoBase64,
                dataCadastro: new Date().toISOString().split('T')[0]
            };

            // Salvar dados do colaborador (simulando pasta com nome do colaborador)
            localStorage.setItem(`colaborador_${nome}`, JSON.stringify(dadosColaborador));

            // Atualizar arquivo de senhas
            const indexExistente = colaboradoresSenhas.findIndex(c => c.nome === nome);
            if (indexExistente >= 0) {
                colaboradoresSenhas[indexExistente] = { nome: nome, senha: senha };
            } else {
                colaboradoresSenhas.push({ nome: nome, senha: senha });
            }
            localStorage.setItem('colaboradores_senhas', JSON.stringify(colaboradoresSenhas));

            alert('Colaborador cadastrado com sucesso!');
            this.limparFormulario();
            this.carregarListaColaboradores();
        };
        reader.readAsDataURL(fotoInput.files[0]);
    }

    normalizarNome(nome) {
        return nome
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_');
    }

    limparFormulario() {
        document.getElementById('form-colaborador').reset();
        document.getElementById('preview-foto').style.display = 'none';
        document.getElementById('preview-placeholder').style.display = 'block';
        document.getElementById('preview-foto').src = '';
    }

    carregarListaColaboradores() {
        const container = document.getElementById('lista-colaboradores');
        const colaboradoresSenhas = JSON.parse(localStorage.getItem('colaboradores_senhas') || '[]');

        if (colaboradoresSenhas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>👥</span>
                    <p>Nenhum colaborador cadastrado</p>
                </div>
            `;
            return;
        }

        container.innerHTML = colaboradoresSenhas.map(colab => {
            const dadosColaborador = JSON.parse(localStorage.getItem(`colaborador_${colab.nome}`) || '{}');
            const foto = dadosColaborador.foto || '';

            return `
                <div class="colaborador-item">
                    <img src="${foto}" alt="${colab.nome}" class="colaborador-foto" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3E${colab.nome.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E'">
                    <div class="colaborador-info">
                        <h4>${colab.nome}</h4>
                        <p>${dadosColaborador.funcao || 'Função não informada'}</p>
                        <p style="font-size: 0.8rem; color: var(--text-secondary);">Cadastrado em: ${dadosColaborador.dataCadastro || 'N/A'}</p>
                    </div>
                    <div class="colaborador-actions">
                        <button class="btn btn-danger btn-small" onclick="admin.excluirColaborador('${colab.nome}')">Excluir</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    excluirColaborador(nome) {
        if (!confirm(`Tem certeza que deseja excluir o colaborador "${nome}"?`)) {
            return;
        }

        // Remover dos colaboradores_senhas
        const colaboradoresSenhas = JSON.parse(localStorage.getItem('colaboradores_senhas') || '[]');
        const filtrados = colaboradoresSenhas.filter(c => c.nome !== nome);
        localStorage.setItem('colaboradores_senhas', JSON.stringify(filtrados));

        // Remover dados do colaborador
        localStorage.removeItem(`colaborador_${nome}`);

        // Remover registros de ponto deste colaborador
        const registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        const registrosFiltrados = registros.filter(r => r.colaboradorNome !== nome);
        localStorage.setItem('registros_ponto', JSON.stringify(registrosFiltrados));

        alert('Colaborador excluído com sucesso!');
        this.carregarListaColaboradores();
    }
}

// Inicializar aplicação admin
const admin = new AdminColaboradores();

