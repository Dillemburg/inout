// Sistema de Ponto Eletrônico - Tela de Registro
class PontoEletronico {
    constructor() {
        this.senhaAtual = '';
        this.colaboradorAtual = null;
        this.stream = null;
        this.init();
    }

    init() {
        this.atualizarHora();
        setInterval(() => this.atualizarHora(), 1000);
        this.setupEventListeners();
        this.carregarDados();
    }

    setupEventListeners() {
        // Teclado numérico
        document.querySelectorAll('.tecla[data-num]').forEach(tecla => {
            tecla.addEventListener('click', (e) => {
                const num = e.target.dataset.num;
                this.adicionarDigito(num);
            });
        });

        // Botões de limpar
        document.getElementById('btn-limpar').addEventListener('click', () => {
            this.limparSenha();
        });

        document.getElementById('btn-limpar-tecla').addEventListener('click', () => {
            this.removerUltimoDigito();
        });

        // Botão confirmar
        document.getElementById('btn-confirmar').addEventListener('click', () => {
            this.validarSenha();
        });

        // Enter no campo de senha
        document.getElementById('senha-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validarSenha();
            }
        });

        // Botão voltar da câmera
        document.getElementById('btn-voltar-camera').addEventListener('click', () => {
            this.voltarParaLogin();
        });

        // Botão entrada/saída
        document.getElementById('btn-entrada-saida').addEventListener('click', () => {
            this.registrarPonto();
        });
    }

    atualizarHora() {
        const agora = new Date();
        const hora = agora.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
        });
        document.getElementById('hora-display').textContent = hora;

        // Atualizar hora na câmera se estiver visível
        if (document.getElementById('tela-camera').style.display !== 'none') {
            this.atualizarHoraCamera();
        }
    }

    atualizarHoraCamera() {
        const agora = new Date();
        const data = agora.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const hora = agora.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        document.getElementById('camera-data-hora').textContent = `${data} - ${hora}`;
    }

    adicionarDigito(digito) {
        if (this.senhaAtual.length < 10) {
            this.senhaAtual += digito;
            this.atualizarDisplaySenha();
            document.getElementById('mensagem-erro').textContent = '';
        }
    }

    removerUltimoDigito() {
        this.senhaAtual = this.senhaAtual.slice(0, -1);
        this.atualizarDisplaySenha();
        document.getElementById('mensagem-erro').textContent = '';
    }

    limparSenha() {
        this.senhaAtual = '';
        this.atualizarDisplaySenha();
        document.getElementById('mensagem-erro').textContent = '';
    }

    atualizarDisplaySenha() {
        const display = '•'.repeat(this.senhaAtual.length);
        document.getElementById('senha-input').value = display;
    }

    carregarDados() {
        // Carregar dados de colaboradores (senhas)
        const colaboradoresData = localStorage.getItem('colaboradores_senhas');
        if (!colaboradoresData) {
            console.log('Nenhum colaborador cadastrado');
        }
    }

    validarSenha() {
        if (this.senhaAtual.length === 0) {
            document.getElementById('mensagem-erro').textContent = 'Digite uma senha';
            return;
        }

        // Carregar arquivo de senhas
        const colaboradoresSenhas = JSON.parse(localStorage.getItem('colaboradores_senhas') || '[]');
        const colaborador = colaboradoresSenhas.find(c => c.senha === this.senhaAtual);

        if (!colaborador) {
            document.getElementById('mensagem-erro').textContent = 'Senha inválida!';
            this.limparSenha();
            return;
        }

        // Carregar dados completos do colaborador
        const colaboradorData = JSON.parse(localStorage.getItem(`colaborador_${colaborador.nome}`) || '{}');
        
        this.colaboradorAtual = {
            nome: colaborador.nome,
            senha: colaborador.senha,
            ...colaboradorData
        };

        // Verificar último registro para determinar se é entrada ou saída
        this.verificarStatusColaborador();
        this.abrirCamera();
    }

    verificarStatusColaborador() {
        const registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        const hoje = new Date().toISOString().split('T')[0];
        
        // Buscar último registro do colaborador hoje
        const registrosHoje = registros
            .filter(r => r.colaboradorNome === this.colaboradorAtual.nome && r.data === hoje)
            .sort((a, b) => b.timestamp - a.timestamp);

        const ultimoRegistro = registrosHoje[0];
        
        if (!ultimoRegistro) {
            this.tipoRegistro = 'entrada';
        } else {
            // Se último foi entrada, próximo é saída (e vice-versa)
            this.tipoRegistro = ultimoRegistro.tipo === 'entrada' ? 'saida' : 'entrada';
        }

        // Atualizar botão
        const btn = document.getElementById('btn-entrada-saida');
        const texto = document.getElementById('btn-texto');
        
        if (this.tipoRegistro === 'entrada') {
            btn.className = 'btn-entrada-saida entrada';
            texto.textContent = 'Entrada';
        } else {
            btn.className = 'btn-entrada-saida saida';
            texto.textContent = 'Saída';
        }
    }

    async abrirCamera() {
        try {
            // Solicitar acesso à câmera
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });

            const video = document.getElementById('video-camera');
            video.srcObject = this.stream;

            // Mostrar tela de câmera
            document.getElementById('tela-login').style.display = 'none';
            document.getElementById('tela-camera').style.display = 'flex';

            // Atualizar nome do colaborador
            document.getElementById('camera-nome').textContent = this.colaboradorAtual.nome;

            // Atualizar hora na câmera
            this.atualizarHoraCamera();
            setInterval(() => this.atualizarHoraCamera(), 1000);

            // Limpar senha
            this.limparSenha();
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            alert('Erro ao acessar a câmera. Verifique as permissões.');
        }
    }

    registrarPonto() {
        const agora = new Date();
        const data = agora.toISOString().split('T')[0];
        const hora = agora.toTimeString().slice(0, 8);

        // Capturar foto
        const video = document.getElementById('video-camera');
        const canvas = document.getElementById('canvas-camera');
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const foto = canvas.toDataURL('image/jpeg', 0.8);

        // Criar registro
        const registro = {
            id: Date.now(),
            colaboradorNome: this.colaboradorAtual.nome,
            tipo: this.tipoRegistro,
            data: data,
            hora: hora,
            timestamp: agora.getTime(),
            foto: foto
        };

        // Salvar registro
        const registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        registros.push(registro);
        localStorage.setItem('registros_ponto', JSON.stringify(registros));

        // Parar câmera
        this.pararCamera();

        // Mostrar mensagem de sucesso
        alert(`Ponto registrado com sucesso!\n${this.colaboradorAtual.nome} - ${this.tipoRegistro === 'entrada' ? 'Entrada' : 'Saída'}`);

        // Voltar para tela de login
        this.voltarParaLogin();
    }

    pararCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    voltarParaLogin() {
        this.pararCamera();
        document.getElementById('tela-camera').style.display = 'none';
        document.getElementById('tela-login').style.display = 'flex';
        this.colaboradorAtual = null;
        this.limparSenha();
    }
}

// Inicializar aplicação
const app = new PontoEletronico();
