document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!localStorage.getItem('authenticated')) {
        window.location.href = 'login.html';
    }

    // Elementos do DOM
    const columnsContainer = document.getElementById('columns-container');
    const addColumnBtn = document.getElementById('addColumn');
    const generateBtn = document.getElementById('generate');
    const downloadTxtBtn = document.getElementById('downloadTxt');
    const downloadDocBtn = document.getElementById('downloadDoc');
    const copyToClipboardBtn = document.getElementById('copyToClipboard');
    const outputEl = document.getElementById('output');
    
    // Elementos adicionais do DOM
    const sqlOperationSelect = document.getElementById('sqlOperation');
    const updateOptionsDiv = document.getElementById('updateOptions');
    const idColumnForUpdateSelect = document.getElementById('idColumnForUpdate');
    
    // Tipos de dados disponíveis para colunas
    const dataTypes = [
        { id: 'id', label: 'ID (Auto incremento)' },
        { id: 'name', label: 'Nome' },
        { id: 'username', label: 'Nome de usuário' },
        { id: 'email', label: 'Email' },
        { id: 'password', label: 'Senha' },
        { id: 'date', label: 'Data' },
        { id: 'number', label: 'Número' },
        { id: 'boolean', label: 'Booleano' },
        { id: 'foreignKey', label: 'Chave Estrangeira / Quantidade' },
        { id: 'text', label: 'Texto' }
    ];
    
    // Sistema de notificações
    function showNotification(type, title, message, duration = 4000) {
        // Remover notificações existentes
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let iconClass = '';
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-circle';
                break;
            case 'error':
                iconClass = 'fas fa-times-circle';
                break;
        }
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Exibir a notificação com animação
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Configurar evento de fechar
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Fechar automaticamente após a duração
        if (duration > 0) {
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }
            }, duration);
        }
    }
    
    // Adicionar coluna
    function addColumn() {
        const columnId = Date.now();
        const columnEl = document.createElement('div');
        columnEl.className = 'column-item';
        columnEl.dataset.id = columnId;
        
        let optionsHtml = '';
        dataTypes.forEach(type => {
            optionsHtml += `<option value="${type.id}">${type.label}</option>`;
        });
        
        columnEl.innerHTML = `
            <div class="column-header">
                <span class="column-title">Coluna</span>
                <button class="btn-remove" onclick="removeColumn(${columnId})"><i class="fas fa-times"></i></button>
            </div>
            <div class="form-group">
                <label for="column-name-${columnId}">Nome da Coluna:</label>
                <input type="text" id="column-name-${columnId}" placeholder="Ex: id_usuario" required>
            </div>
            <div class="column-config">
                <div class="form-group">
                    <label for="column-type-${columnId}">Tipo de Dado:</label>
                    <select id="column-type-${columnId}" onchange="updateColumnOptions(${columnId})">
                        ${optionsHtml}
                    </select>
                </div>
                <div class="form-group column-options" id="column-options-${columnId}">
                    <!-- Opções específicas serão adicionadas pelo JS -->
                </div>
            </div>
        `;
        
        columnsContainer.appendChild(columnEl);
        updateColumnOptions(columnId);
    }
    
    // Atualizar opções da coluna com base no tipo selecionado
    window.updateColumnOptions = function(columnId) {
        const columnType = document.getElementById(`column-type-${columnId}`).value;
        const optionsContainer = document.getElementById(`column-options-${columnId}`);
        
        let optionsHtml = '';
        
        switch(columnType) {
            case 'id':
                optionsHtml = `
                    <label for="column-start-${columnId}">Valor Inicial:</label>
                    <input type="number" id="column-start-${columnId}" value="1" min="1">
                `;
                break;
            case 'number':
                optionsHtml = `
                    <label for="column-min-${columnId}">Valor Mínimo:</label>
                    <input type="number" id="column-min-${columnId}" value="1">
                    <label for="column-max-${columnId}">Valor Máximo:</label>
                    <input type="number" id="column-max-${columnId}" value="100">
                `;
                break;
            case 'foreignKey':
                optionsHtml = `
                    <label for="column-mode-${columnId}">Modo:</label>
                    <select id="column-mode-${columnId}">
                        <option value="id">ID Referência</option>
                        <option value="count">Quantidade</option>
                    </select>
                    <label for="column-min-${columnId}">Valor Mínimo:</label>
                    <input type="number" id="column-min-${columnId}" value="1">
                    <label for="column-max-${columnId}">Valor Máximo:</label>
                    <input type="number" id="column-max-${columnId}" value="5">
                `;
                break;
            case 'date':
                optionsHtml = `
                    <label for="column-date-mode-${columnId}">Tipo de Data:</label>
                    <select id="column-date-mode-${columnId}">
                        <option value="now">Data Atual</option>
                        <option value="past">Data Passada</option>
                        <option value="future">Data Futura</option>
                        <option value="random">Data Aleatória</option>
                    </select>
                `;
                break;
        }
        
        optionsContainer.innerHTML = optionsHtml;
        
        // Atualizar opções de UPDATE se estiver visível
        if (updateOptionsDiv && updateOptionsDiv.style.display !== 'none') {
            updateIdColumnOptions();
        }
    };
    
    // Remover coluna
    window.removeColumn = function(columnId) {
        const column = document.querySelector(`.column-item[data-id="${columnId}"]`);
        if (column) {
            column.remove();
            
            // Atualizar opções de UPDATE se estiver visível
            if (updateOptionsDiv.style.display !== 'none') {
                updateIdColumnOptions();
            }
        }
    };
    
    // Gerar valores aleatórios
    function generateRandomValue(type, options = {}) {
        switch(type) {
            case 'id':
                return options.currentId || 1;
            case 'name':
                const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia', 'Marcos', 'Fernanda', 'Lucas', 'Mariana'];
                const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima'];
                return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            case 'username':
                const userNames = ['usuario', 'jogador', 'gamer', 'player', 'ninja', 'mestre', 'pro', 'legend', 'elite', 'star'];
                const suffix = Math.floor(Math.random() * 1000);
                return `${userNames[Math.floor(Math.random() * userNames.length)]}${suffix}`;
            case 'email':
                const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
                const username = generateRandomValue('username');
                return `${username.toLowerCase().replace(' ', '.')}@${domains[Math.floor(Math.random() * domains.length)]}`;
            case 'password':
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                let password = '';
                for (let i = 0; i < 10; i++) {
                    password += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return password;
            case 'date':
                const now = new Date();
                let date;
                
                switch(options.dateMode) {
                    case 'now':
                        date = now;
                        break;
                    case 'past':
                        date = new Date(now.getTime() - Math.random() * 31536000000); // Até 1 ano atrás
                        break;
                    case 'future':
                        date = new Date(now.getTime() + Math.random() * 31536000000); // Até 1 ano à frente
                        break;
                    case 'random':
                        const randomTime = now.getTime() + (Math.random() * 2 - 1) * 31536000000; // Entre 1 ano atrás e 1 ano à frente
                        date = new Date(randomTime);
                        break;
                    default:
                        date = now;
                }
                
                return date.toISOString().split('T')[0];
            case 'number':
                const min = options.min || 1;
                const max = options.max || 100;
                return Math.floor(Math.random() * (max - min + 1)) + min;
            case 'boolean':
                return Math.random() > 0.5 ? 1 : 0;
            case 'foreignKey':
                if (options.mode === 'count') {
                    const min = options.min || 1;
                    const max = options.max || 5;
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                } else {
                    const min = options.min || 1;
                    const max = options.max || 5;
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                }
            case 'text':
                const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'suspendisse', 'potenti'];
                const length = Math.floor(Math.random() * 8) + 3;
                let text = '';
                for (let i = 0; i < length; i++) {
                    text += words[Math.floor(Math.random() * words.length)] + ' ';
                }
                return text.trim();
            default:
                return '';
        }
    }
    
    // Gerar SQL
    function generateSQL() {
        const dbName = document.getElementById('dbName').value || 'meu_banco';
        const tableName = document.getElementById('tableName').value || 'minha_tabela';
        const totalRecords = parseInt(document.getElementById('totalRecords').value) || 10;
        const operation = document.getElementById('sqlOperation').value;
        
        const columns = Array.from(document.querySelectorAll('.column-item'));
        
        if (columns.length === 0) {
            showNotification('error', 'Erro', 'Adicione pelo menos uma coluna para gerar o SQL!');
            return '';
        }
        
        if (operation === 'insert') {
            // Obter informações das colunas para INSERT
            const columnDataList = columns.map(column => {
                const columnId = column.dataset.id;
                const columnName = document.getElementById(`column-name-${columnId}`).value;
                const columnType = document.getElementById(`column-type-${columnId}`).value;
                
                let options = {};
                
                if (columnType === 'id') {
                    options.start = parseInt(document.getElementById(`column-start-${columnId}`).value) || 1;
                } else if (columnType === 'number') {
                    options.min = parseInt(document.getElementById(`column-min-${columnId}`).value) || 1;
                    options.max = parseInt(document.getElementById(`column-max-${columnId}`).value) || 100;
                } else if (columnType === 'foreignKey') {
                    options.mode = document.getElementById(`column-mode-${columnId}`).value;
                    options.min = parseInt(document.getElementById(`column-min-${columnId}`).value) || 1;
                    options.max = parseInt(document.getElementById(`column-max-${columnId}`).value) || 5;
                } else if (columnType === 'date') {
                    options.dateMode = document.getElementById(`column-date-mode-${columnId}`).value;
                }
                
                return { name: columnName, type: columnType, options };
            });
            
            let sql = `-- SQL para criar e popular a tabela ${tableName} no banco ${dbName}\n\n`;
            
            // Verificar se tabela e banco existem
            sql += `-- Verifica se o banco de dados existe, se não existir, cria\n`;
            sql += `CREATE DATABASE IF NOT EXISTS ${dbName};\n`;
            sql += `USE ${dbName};\n\n`;
            
            // Gerar CREATE TABLE
            sql += `-- Criando a tabela ${tableName}\n`;
            sql += `DROP TABLE IF EXISTS ${tableName};\n`;
            sql += `CREATE TABLE ${tableName} (\n`;
            
            // Mapear tipos de dados para tipos SQL
            const sqlColumns = columnDataList.map(column => {
                switch(column.type) {
                    case 'id':
                        return `    ${column.name} INT AUTO_INCREMENT PRIMARY KEY`;
                    case 'name':
                    case 'username':
                        return `    ${column.name} VARCHAR(100)`;
                    case 'email':
                        return `    ${column.name} VARCHAR(150)`;
                    case 'password':
                        return `    ${column.name} VARCHAR(255)`;
                    case 'date':
                        return `    ${column.name} DATE`;
                    case 'number':
                    case 'foreignKey':
                        return `    ${column.name} INT`;
                    case 'boolean':
                        return `    ${column.name} TINYINT(1)`;
                    case 'text':
                        return `    ${column.name} TEXT`;
                    default:
                        return `    ${column.name} VARCHAR(255)`;
                }
            });
            
            sql += sqlColumns.join(',\n');
            sql += '\n);\n\n';
            
            // Gerar comandos INSERT
            sql += `-- Inserindo dados na tabela ${tableName}\n`;
            
            for (let i = 0; i < totalRecords; i++) {
                const values = columnDataList.map(column => {
                    let value;
                    
                    if (column.type === 'id') {
                        value = column.options.start + i;
                    } else {
                        value = generateRandomValue(column.type, column.options);
                    }
                    
                    // Formatar valor para SQL
                    if (typeof value === 'string') {
                        return `'${value}'`;
                    } else if (value === null) {
                        return 'NULL';
                    } else {
                        return value;
                    }
                });
                
                const columnNames = columnDataList.map(column => column.name).join(', ');
                const valuesSql = values.join(', ');
                
                sql += `INSERT INTO ${tableName} (${columnNames}) VALUES (${valuesSql});\n`;
            }
            
            return sql;
        } else if (operation === 'update') {
            // Gerar SQL de UPDATE
            return generateUpdateSQL(dbName, tableName, totalRecords, columns);
        }
        
        return '';
    }
    
    // Função para gerar SQL UPDATE
    function generateUpdateSQL(dbName, tableName, totalRecords, columns) {
        const idColumn = document.getElementById('idColumnForUpdate').value;
        const startId = parseInt(document.getElementById('startId').value) || 1;
        const endId = parseInt(document.getElementById('endId').value) || 1000;
        
        if (!idColumn) {
            showNotification('error', 'Erro', 'Selecione uma coluna de ID para gerar comandos UPDATE');
            return '';
        }
        
        // Obter as colunas selecionadas para atualização do seletor múltiplo
        const updateColumnsSelect = document.getElementById('updateColumnsSelect');
        const selectedColumns = Array.from(updateColumnsSelect.selectedOptions).map(option => option.value);
        
        if (selectedColumns.length === 0) {
            showNotification('error', 'Erro', 'Selecione pelo menos uma coluna para atualizar');
            return '';
        }
        
        // Obter informações das colunas
        const columnDataList = columns.map(column => {
            const columnId = column.dataset.id;
            const columnName = document.getElementById(`column-name-${columnId}`).value;
            const columnType = document.getElementById(`column-type-${columnId}`).value;
            
            let options = {};
            
            if (columnType === 'id') {
                options.start = parseInt(document.getElementById(`column-start-${columnId}`).value) || 1;
            } else if (columnType === 'number') {
                options.min = parseInt(document.getElementById(`column-min-${columnId}`).value) || 1;
                options.max = parseInt(document.getElementById(`column-max-${columnId}`).value) || 100;
            } else if (columnType === 'foreignKey') {
                options.mode = document.getElementById(`column-mode-${columnId}`).value;
                options.min = parseInt(document.getElementById(`column-min-${columnId}`).value) || 1;
                options.max = parseInt(document.getElementById(`column-max-${columnId}`).value) || 5;
            } else if (columnType === 'date') {
                options.dateMode = document.getElementById(`column-date-mode-${columnId}`).value;
            }
            
            return { name: columnName, type: columnType, options };
        });
        
        // Filtrar apenas as colunas selecionadas para atualização
        const columnsToUpdate = columnDataList.filter(col => 
            selectedColumns.includes(col.name) && col.name !== idColumn
        );
        
        if (columnsToUpdate.length === 0) {
            showNotification('error', 'Erro', 'Selecione pelo menos uma coluna diferente da coluna de ID para atualizar.');
            return '';
        }
        
        let sql = `-- SQL para atualizar dados na tabela ${tableName} no banco ${dbName}\n\n`;
        
        // Verificar se o banco existe
        sql += `-- Verifica se o banco de dados existe\n`;
        sql += `USE ${dbName};\n\n`;
        
        // Gerar comandos UPDATE
        sql += `-- Atualizando colunas: ${columnsToUpdate.map(c => c.name).join(', ')} na tabela ${tableName}\n`;
        
        // Determinar o número real de registros a atualizar
        const numUpdates = Math.min(totalRecords, endId - startId + 1);
        
        for (let i = 0; i < numUpdates; i++) {
            const currentId = startId + i;
            
            // Preparar os valores de atualização
            const setStatements = columnsToUpdate.map(column => {
                let value = generateRandomValue(column.type, column.options);
                
                // Formatar valor para SQL
                if (typeof value === 'string') {
                    return `${column.name} = '${value}'`;
                } else if (value === null) {
                    return `${column.name} = NULL`;
                } else {
                    return `${column.name} = ${value}`;
                }
            }).join(', ');
            
            sql += `UPDATE ${tableName} SET ${setStatements} WHERE ${idColumn} = ${currentId};\n`;
        }
        
        return sql;
    }
    
    // Baixar como arquivo de texto
    function downloadAsText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Baixar como documento Word (versão corrigida)
    function downloadAsDoc(text, filename) {
        // Utilizando uma abordagem diferente para o formato DOC
        // Cria um Blob com o texto puro sem as tags HTML
        const blob = new Blob([text], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Método alternativo para copiar para a área de transferência
    function copyToClipboard(text) {
        // Cria um elemento de texto temporário
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Torna o elemento invisível
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        // Preserva a seleção anterior
        const selected = document.getSelection().rangeCount > 0 
            ? document.getSelection().getRangeAt(0) 
            : false;
        
        // Seleciona e copia o texto
        textArea.select();
        let success = false;
        
        try {
            success = document.execCommand('copy');
            if (success) {
                showNotification('success', 'Copiado!', 'SQL copiado para a área de transferência com sucesso!');
            } else {
                showNotification('error', 'Erro', 'Não foi possível copiar. Tente selecionar o texto manualmente.');
            }
        } catch (err) {
            console.error('Erro ao copiar:', err);
            showNotification('error', 'Erro', 'Ocorreu um erro ao copiar. Tente selecionar o texto manualmente.');
        }
        
        // Limpa
        document.body.removeChild(textArea);
        
        // Restaura a seleção anterior se existia
        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }
    }
    
    // Event listeners
    addColumnBtn.addEventListener('click', function() {
        addColumn();
        // Destacar brevemente a nova coluna
        const newColumn = columnsContainer.lastChild;
        newColumn.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
        setTimeout(() => {
            newColumn.style.boxShadow = '';
        }, 1000);
        
        // Atualizar opções de coluna ID para UPDATE se estiver visível
        if (updateOptionsDiv.style.display !== 'none') {
            updateIdColumnOptions();
        }
    });
    
    generateBtn.addEventListener('click', function() {
        const totalRecords = parseInt(document.getElementById('totalRecords').value) || 10;
        
        // Aviso para grandes volumes de dados
        if (totalRecords > 10000) {
            const confirm = window.confirm(`Você está prestes a gerar ${totalRecords} registros. Isso pode levar algum tempo e consumir recursos do seu computador. Deseja continuar?`);
            if (!confirm) {
                return;
            }
        }
        
        const originalText = this.innerHTML;
        this.innerHTML = `<span class="loading-spinner"></span> Gerando SQL...`;
        this.classList.add('btn-generating');
        
        // Envolver em setTimeout com requestAnimationFrame para não bloquear a interface
        setTimeout(() => {
            requestAnimationFrame(() => {
                const sql = generateSQL();
                if (sql) {
                    outputEl.innerHTML = highlightSQL(sql);
                    downloadTxtBtn.disabled = false;
                    downloadDocBtn.disabled = false;
                    copyToClipboardBtn.disabled = false;
                    
                    // Restaurar o botão
                    this.innerHTML = originalText;
                    this.classList.remove('btn-generating');
                    
                    showNotification('success', 'SQL Gerado', 'Seu código SQL foi gerado com sucesso!');
                    
                    // Scroll para a seção de saída
                    document.querySelector('.output-card').scrollIntoView({ behavior: 'smooth' });
                } else {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-generating');
                }
            });
        }, 100);
    });
    
    downloadTxtBtn.addEventListener('click', function() {
        const dbName = document.getElementById('dbName').value || 'meu_banco';
        const tableName = document.getElementById('tableName').value || 'minha_tabela';
        const sql = outputEl.textContent;
        downloadAsText(sql, `${dbName}_${tableName}_dados.sql`);
        showNotification('success', 'Download Iniciado', 'Seu arquivo SQL está sendo baixado.');
    });
    
    downloadDocBtn.addEventListener('click', function() {
        const dbName = document.getElementById('dbName').value || 'meu_banco';
        const tableName = document.getElementById('tableName').value || 'minha_tabela';
        const sql = outputEl.textContent;
        downloadAsDoc(sql, `${dbName}_${tableName}_dados.doc`);
        showNotification('success', 'Download Iniciado', 'Seu arquivo DOC está sendo baixado.');
    });
    
    copyToClipboardBtn.addEventListener('click', function() {
        const sql = outputEl.textContent;
        copyToClipboard(sql);
    });
    
    // Adicionar uma coluna por padrão
    addColumn();

    // Realce de sintaxe para SQL
    function highlightSQL(sql) {
        // Palavras-chave SQL
        const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'TABLE', 'DATABASE', 'USE', 'IF', 'NOT', 'EXISTS', 'NULL', 'PRIMARY', 'KEY', 'AUTO_INCREMENT', 'INT', 'VARCHAR', 'TEXT', 'DATE', 'TINYINT'];
        
        // Substituir comentários
        let highlighted = sql.replace(/--(.+?)(\n|$)/g, '<span class="comment">--$1</span>$2');
        
        // Substituir strings
        highlighted = highlighted.replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>');
        
        // Substituir números
        highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
        
        // Substituir palavras-chave
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            highlighted = highlighted.replace(regex, match => `<span class="keyword">${match}</span>`);
        });
        
        // Substituir operadores
        highlighted = highlighted.replace(/([;,()])/g, '<span class="operator">$1</span>');
        
        return highlighted;
    }

    // Adicionar tooltips aos botões
    function addTooltip(element, text) {
        element.classList.add('tooltip');
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip-text';
        tooltip.textContent = text;
        element.appendChild(tooltip);
    }

    addTooltip(downloadTxtBtn, 'Baixar como arquivo SQL');
    addTooltip(downloadDocBtn, 'Baixar como documento Word');
    addTooltip(copyToClipboardBtn, 'Copiar para área de transferência');

    // Evento para mostrar/esconder opções de UPDATE
    sqlOperationSelect.addEventListener('change', function() {
        if (this.value === 'update') {
            updateOptionsDiv.style.display = 'block';
            // Atualizar opções de coluna ID para UPDATE
            updateIdColumnOptions();
        } else {
            updateOptionsDiv.style.display = 'none';
        }
    });
    
    // Atualizar opções de coluna ID para UPDATE
    function updateIdColumnOptions() {
        // Salvar as seleções atuais para restaurar depois
        const currentIdColumn = idColumnForUpdateSelect.value;
        const currentStartId = document.getElementById('startId').value;
        const currentEndId = document.getElementById('endId').value;
        
        // Salvar as colunas selecionadas atualmente
        const updateColumnsSelect = document.getElementById('updateColumnsSelect');
        const selectedColumnValues = Array.from(updateColumnsSelect.selectedOptions).map(opt => opt.value);
        
        // Limpar opções existentes
        idColumnForUpdateSelect.innerHTML = '<option value="">Selecione uma coluna de ID</option>';
        
        // Obter todas as colunas atuais
        const columns = Array.from(document.querySelectorAll('.column-item'));
        
        // Para armazenar os dados de todas as colunas
        const columnData = [];
        
        // Adicionar cada coluna como opção para o dropdown de ID
        columns.forEach(column => {
            const columnId = column.dataset.id;
            const columnName = document.getElementById(`column-name-${columnId}`).value;
            const columnType = document.getElementById(`column-type-${columnId}`).value;
            
            if (columnName) {
                // Adicionar ao dropdown de ID
                const option = document.createElement('option');
                option.value = columnName;
                option.textContent = columnName;
                
                // Se esta era a coluna ID selecionada anteriormente, selecionar de novo
                if (columnName === currentIdColumn) {
                    option.selected = true;
                }
                
                idColumnForUpdateSelect.appendChild(option);
                
                // Salvar dados da coluna para a lista de seleção
                columnData.push({
                    id: columnId,
                    name: columnName,
                    type: columnType
                });
            }
        });
        
        // Adicionar opções para seleção de colunas a atualizar
        updateColumnsSelect.innerHTML = '';
        
        if (columnData.length === 0) {
            const option = document.createElement('option');
            option.disabled = true;
            option.textContent = 'Nenhuma coluna definida';
            updateColumnsSelect.appendChild(option);
            return;
        }
        
        // Adicionar as colunas ao seletor
        columnData.forEach(column => {
            const option = document.createElement('option');
            option.value = column.name;
            option.textContent = column.name;
            
            // Verificar se esta coluna estava selecionada anteriormente
            if (selectedColumnValues.includes(column.name)) {
                option.selected = true;
            }
            
            updateColumnsSelect.appendChild(option);
        });
        
        // Restaurar valores de início e fim do ID se existirem
        if (currentStartId) {
            document.getElementById('startId').value = currentStartId;
        }
        
        if (currentEndId) {
            document.getElementById('endId').value = currentEndId;
        }
    }

    // Adicionar evento de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('authenticated');
            localStorage.removeItem('authTime');
            window.location.href = 'login.html';
        });
    }
}); 