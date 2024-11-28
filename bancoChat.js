const input = require("prompt-sync")();
const chalk = require('chalk');
const fs = require('fs');
const crypto = require('crypto');

let contas = [];
let contaAtual = null;

function salvarDados() {
    fs.writeFileSync('contas.json', JSON.stringify(contas));
}

function carregarDados() {
    if (fs.existsSync('contas.json')) {
        contas = JSON.parse(fs.readFileSync('contas.json'));
    }
}

function exibirLogo() {
    console.log(chalk.bold.cyan(`
    ╔══════════════════════════════════════╗
    ║                                      ║
    ║         ${chalk.yellow('C H A T   B A N K')}           ║
    ║                                      ║
    ╚══════════════════════════════════════╝
    `));
}

function exibirMenu(opcoes) {
    console.log(chalk.cyan('╔══════════════════════════════════════╗'));
    opcoes.forEach((opcao, index) => {
        console.log(chalk.cyan(`║  ${chalk.yellow(index + 1)} - ${chalk.white(opcao.padEnd(30))} ║`));
    });
    console.log(chalk.cyan('╚══════════════════════════════════════╝'));
}

function hashSenha(senha) {
    return crypto.createHash('sha256').update(senha).digest('hex');
}

function criarConta() {
    console.log(chalk.cyan('\n═══ Criação de Nova Conta ═══'));
    let nomeCompleto = input(chalk.blue("Digite seu nome completo: "));
    let numeroConta = gerarNumeroConta();
    let senha = input(chalk.blue("Digite uma senha para a conta: "));
    let saldoInicial = Number(input(chalk.blue("Digite o saldo inicial da conta: ")));
    
    let novaConta = {
        nome: nomeCompleto,
        numero: numeroConta,
        senha: hashSenha(senha),
        saldo: saldoInicial,
        extrato: [{data: new Date().toISOString(), descricao: "Saldo inicial", valor: saldoInicial}],
        ultimoAcesso: new Date().toISOString(),
        limiteCredito: 1000
    };
    
    contas.push(novaConta);
    salvarDados();
    console.log(chalk.green(`\n✅ Conta criada com sucesso! Seu número de conta é: ${chalk.bold(numeroConta)}`));
}

function gerarNumeroConta() {
    let numero;
    do {
        numero = Math.floor(10000 + Math.random() * 90000).toString();
    } while (contas.some(conta => conta.numero === numero));
    return numero;
}

function login() {
    console.log(chalk.cyan('\n═══ Login ═══'));
    let numeroConta = input(chalk.blue("Digite o número da conta: "));
    let senha = input(chalk.blue("Digite a senha: "));
    
    contaAtual = contas.find(conta => conta.numero === numeroConta && conta.senha === hashSenha(senha));
    
    if (contaAtual) {
        contaAtual.ultimoAcesso = new Date().toISOString();
        salvarDados();
        console.log(chalk.green(`\n✅ Bem-vindo, ${chalk.bold(contaAtual.nome)}!`));
        return true;
    } else {
        console.log(chalk.red("\n❌ Número da conta ou senha incorretos."));
        return false;
    }
}

function main() {
    carregarDados();
    
    while (true) {
        exibirLogo();
        exibirMenu(['Criar nova conta', 'Acessar conta existente', 'Sair']);
        
        let opcao = Number(input(chalk.blue("Escolha uma opção: ")));
        
        if (opcao === 1) {
            criarConta();
        } else if (opcao === 2) {
            if (login()) {
                menuConta();
            }
        } else if (opcao === 3) {
            console.log(chalk.green("\n👋 Obrigado por usar o CHAT BANK!"));
            break;
        } else {
            console.log(chalk.red("❌ Opção inválida!"));
        }
    }
}

function menuConta() {
    while (true) {
        console.log(chalk.cyan(`\n═══ Conta de ${chalk.bold(contaAtual.nome)} ═══`));
        exibirMenu(['Saldo', 'Extrato', 'Saque', 'Depósito', 'Transferência', 'Solicitar Empréstimo', 'Sair da conta']);
        
        let opcao = Number(input(chalk.blue("Escolha uma opção: ")));
        
        if (opcao === 1) {
            let saldoAtual = contaAtual.saldo.toFixed(2);
            let corSaldo = contaAtual.saldo < 0 ? chalk.red : chalk.green;
            let limiteUtilizado = Math.max(0, -contaAtual.saldo);
            let limiteDisponivel = contaAtual.limiteCredito - limiteUtilizado;
            console.log(chalk.yellow(`\n💰 Saldo atual: ${corSaldo(`R$ ${saldoAtual}`)}`));
            console.log(chalk.yellow(`💳 Limite de crédito total: ${chalk.green(`R$ ${contaAtual.limiteCredito.toFixed(2)}`)}`));
            console.log(chalk.yellow(`💳 Limite de crédito utilizado: ${chalk.red(`R$ ${limiteUtilizado.toFixed(2)}`)}`));
            console.log(chalk.yellow(`💳 Limite de crédito disponível: ${chalk.green(`R$ ${limiteDisponivel.toFixed(2)}`)}`));
        } else if (opcao === 2) {
            exibirExtrato();
        } else if (opcao === 3) {
            realizarSaque();
        } else if (opcao === 4) {
            realizarDeposito();
        } else if (opcao === 5) {
            realizarTransferencia();
        } else if (opcao === 6) {
            solicitarEmprestimo();
        } else if (opcao === 7) {
            console.log(chalk.green("\n👋 Saindo da conta. Até logo!"));
            break;
        } else {
            console.log(chalk.red("❌ Opção inválida!"));
        }
    }
}

function exibirExtrato() {
    console.log(chalk.yellow("\n📜 Extrato:"));
    if (contaAtual.extrato.length === 0) {
        console.log(chalk.gray("Nenhuma transação realizada."));
    } else {
        contaAtual.extrato.forEach(transacao => {
            let data = new Date(transacao.data).toLocaleString();
            console.log(chalk.white(`• ${data} - ${transacao.descricao}: R$ ${transacao.valor.toFixed(2)}`));
        });
    }
}

function realizarSaque() {
    let valorSaque = Number(input(chalk.blue("Digite o valor do saque: ")));
    let saldoDisponivel = contaAtual.saldo + contaAtual.limiteCredito;
    
    if (valorSaque > saldoDisponivel) {
        console.log(chalk.red(`❌ Saque não autorizado. Valor excede o saldo disponível.`));
        console.log(chalk.yellow(`Saldo: R$ ${contaAtual.saldo.toFixed(2)}`));
        console.log(chalk.yellow(`Limite de crédito: R$ ${contaAtual.limiteCredito.toFixed(2)}`));
        console.log(chalk.yellow(`Saldo disponível: R$ ${saldoDisponivel.toFixed(2)}`));
    } else {
        contaAtual.saldo -= valorSaque;
        contaAtual.extrato.push({
            data: new Date().toISOString(),
            descricao: "Saque",
            valor: -valorSaque
        });
        salvarDados();
        console.log(chalk.green(`✅ Saque de R$ ${valorSaque.toFixed(2)} realizado com sucesso.`));
        if (contaAtual.saldo < 0) {
            console.log(chalk.yellow(`Atenção: Você está utilizando R$ ${Math.abs(contaAtual.saldo).toFixed(2)} do seu limite de crédito.`));
        }
    }
}

function realizarDeposito() {
    let valorDeposito = Number(input(chalk.blue("Digite o valor do depósito: ")));
    contaAtual.saldo += valorDeposito;
    contaAtual.extrato.push({
        data: new Date().toISOString(),
        descricao: "Depósito",
        valor: valorDeposito
    });
    salvarDados();
    console.log(chalk.green(`✅ Depósito de R$ ${valorDeposito.toFixed(2)} realizado com sucesso.`));
}

function realizarTransferencia() {
    let contaDestino = input(chalk.blue("Digite o número da conta de destino: "));
    let valorTransferencia = Number(input(chalk.blue("Digite o valor da transferência: ")));
    
    if (valorTransferencia > contaAtual.saldo) {
        console.log(chalk.red("❌ Saldo insuficiente para transferência!"));
    } else {
        let contaDestinoObj = contas.find(conta => conta.numero === contaDestino);
        if (contaDestinoObj) {
            contaAtual.saldo -= valorTransferencia;
            contaDestinoObj.saldo += valorTransferencia;
            contaAtual.extrato.push({
                data: new Date().toISOString(),
                descricao: `Transferência para conta ${contaDestino}`,
                valor: -valorTransferencia
            });
            contaDestinoObj.extrato.push({
                data: new Date().toISOString(),
                descricao: `Transferência recebida da conta ${contaAtual.numero}`,
                valor: valorTransferencia
            });
            salvarDados();
            console.log(chalk.green(`✅ Transferência de R$ ${valorTransferencia.toFixed(2)} realizada com sucesso.`));
        } else {
            console.log(chalk.red("❌ Conta de destino não encontrada."));
        }
    }
}

function solicitarEmprestimo() {
    let valorEmprestimo = Number(input(chalk.blue("Digite o valor do empréstimo desejado: ")));
    let limiteEmprestimo = Math.max(contaAtual.saldo * 2, 0);
    
    if (valorEmprestimo > limiteEmprestimo) {
        console.log(chalk.red(`❌ Empréstimo negado. Seu limite é de R$ ${limiteEmprestimo.toFixed(2)}`));
    } else {
        contaAtual.saldo += valorEmprestimo;
        contaAtual.extrato.push({
            data: new Date().toISOString(),
            descricao: "Empréstimo",
            valor: valorEmprestimo
        });
        salvarDados();
        console.log(chalk.green(`✅ Empréstimo de R$ ${valorEmprestimo.toFixed(2)} aprovado e depositado em sua conta.`));
    }
}

main();