document.addEventListener("DOMContentLoaded", function() {
	
	//đăng ký Service Worker:
	if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
	}
	
    const apiKeyInput = document.getElementById("apiKey");
    const secretKeyInput = document.getElementById("secretKey");
    const passphraseInput = document.getElementById("passphrase");
    const tokenNameInput = document.getElementById("tokenName");
    const tokenPriceSpan = document.getElementById("tokenPrice");

    const saveApiKeyButton = document.getElementById("saveApiKey");
    const saveAsApiKeyButton = document.getElementById("saveAsApiKey");
    const loadApiKeyButton = document.getElementById("loadApiKey");
    const fileInput = document.getElementById("fileInput");

    const clearOrderTableButton = document.getElementById("clearOrderTable");
    const addOrderRowButton = document.getElementById("addOrderRow");
    const saveAsOrderTableButton = document.getElementById("saveAsOrderTable");
    const loadOrderTableInput = document.getElementById("loadOrderTable");

    const clearLowTableButton = document.getElementById("clearLowTable");
    const addLowRowButton = document.getElementById("addLowRow");
    const saveAsLowTableButton = document.getElementById("saveAsLowTable");
    const loadLowTableInput = document.getElementById("loadLowTable");

    const clearTargetTableButton = document.getElementById("clearTargetTable");
    const addTargetRowButton = document.getElementById("addTargetRow");
    const saveAsTargetTableButton = document.getElementById("saveAsTargetTable");
    const loadTargetTableInput = document.getElementById("loadTargetTable");

    const loadOrderTableButton = document.getElementById("loadOrderTable");
    const fileInputOrderTable = document.getElementById("fileInputOrderTable");
    
    const loadLowTableButton = document.getElementById("loadLowTable");
    const fileInputLowTable = document.getElementById("fileInputLowTable");
    
    const loadTargetTableButton = document.getElementById("loadTargetTable");
    const fileInputTargetTable = document.getElementById("fileInputTargetTable");

	let tokenName = '';
    let varTokenPrice = 0;
    let orders = [];
    let conditions = [];
	let updateInterval = 1000; // Default interval

    // Thêm biến toàn cục để theo dõi trạng thái của toggle
    let isTradeEnabled = false;
	let priceUpdateTimer = null;
    // Thêm hàm để bắt đầu/dừng vòng lặp
    function toggleTrading() {
        isTradeEnabled = tradingCheckbox.checked; // Cập nhật trạng thái từ checkbox
        
        if (isTradeEnabled) {
            // Bắt đầu vòng lặp khi enabled = true
            updateTokenPrice();
            priceUpdateTimer = setInterval(() => {
                updateTokenPrice();
                checkConditions(); 
            }, updateInterval);
            showAlert("Trading enabled");
        } else {
            // Dừng vòng lặp khi enabled = false 
            if (priceUpdateTimer) {
                clearInterval(priceUpdateTimer);
                priceUpdateTimer = null;
            }
            varTokenPrice = 0;
            tokenPriceSpan.textContent = varTokenPrice.toFixed(8);
            showAlert("Trading disabled");
        }
    }

    // Thêm event listener cho checkbox
    const tradingCheckbox = document.getElementById("toggleSwitch");
    tradingCheckbox.addEventListener("change", (e) => {
        toggleTrading();
    });

    // Save API keys to global variables
    function saveApiKey() {
        const apiKey = apiKeyInput.value;
        const secretKey = secretKeyInput.value;
        const passphrase = passphraseInput.value;
        // Implement your logic to save these keys securely
        showAlert("API Key, Secret Key, and Passphrase saved.");
    }

    // Save API keys to JSON file
    function saveAsApiKey() {
        const apiKeyData = {
            apiKey: apiKeyInput.value,
            secretKey: secretKeyInput.value,
            passphrase: passphraseInput.value
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(apiKeyData));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "apikeys.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    // Load API keys from JSON file
    function loadApiKey(file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                apiKeyInput.value = data.apiKey;
                secretKeyInput.value = data.secretKey;
                passphraseInput.value = data.passphrase;
                
                // Reset file input để có thể load lại file
                document.getElementById('fileInput').value = '';
                
                showAlert("API keys loaded successfully");
            } catch (error) {
                showAlert("Error loading API keys: " + error.message);
            }
        };
        reader.onerror = function() {
            showAlert("Error reading file");
        };
        reader.readAsText(file);
    }

    // Fetch and update token price
	async function updateTokenPrice() {
		tokenName = tokenNameInput.value.trim().toUpperCase();
		if (!tokenName) {
			showAlert("Vui lòng nhập tên token hợp lệ");
			return;
		}

		// Danh sách các API để thử
		const apis = [
			{
				name: 'Binance',
				url: `https://api.binance.com/api/v3/ticker/price?symbol=${tokenName}USDT`,
				processResponse: (data) => parseFloat(data.price)
			},
			{
				name: 'OKX',
				url: `https://www.okx.com/api/v5/market/ticker?instId=${tokenName}-USDT`,
				processResponse: (data) => parseFloat(data.data[0].last)
			},
			{
				name: 'Huobi',
				url: `https://api.huobi.pro/market/detail/merged?symbol=${tokenName.toLowerCase()}usdt`,
				processResponse: (data) => parseFloat(data.tick.close)
			}
		];

		// Thử lần lượt t�ng API
		for (const api of apis) {
			try {
				const response = await fetch(api.url);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				
				const data = await response.json();
				varTokenPrice = api.processResponse(data);
				
				if (varTokenPrice && !isNaN(varTokenPrice)) {
					tokenPriceSpan.textContent = varTokenPrice.toFixed(8);
					console.log(`Giá được lấy từ ${api.name}`);
					return; // Thoát khỏi hàm n�u lấy giá thành công
				}
				
				throw new Error('Giá không hợp lệ');
				
			} catch (error) {
				console.warn(`Lỗi khi lấy giá từ ${api.name}:`, error.message);
				// Tiếp tục với API ti�p theo nếu có lỗi
				continue;
			}
		}

		// Nếu tất cả API đều thất bại
		showAlert("Không thể lấy giá token từ tất cả các nguồn");
	}


		// Add row to order table
	function addOrderRow() {
		const orderTableBody = document.getElementById("orderTableBody");
		const row = document.createElement("tr");

		// Define options for all select elements
		const options0 = ['market', 'limit'];
		const options1 = ['buy', 'sell'];
		const options2 = ['base_ccy', 'quote_ccy'];
		const logicOptions = ['>', '<', '='];  // Thêm options cho logic

		// Create all select elements
		const select0 = document.createElement("select");
		const select1 = document.createElement("select");
		const select2 = document.createElement("select");
		const logicSelect = document.createElement("select");  // Thêm select cho logic

		// Populate all selects
		[
			{ select: select0, options: options0 },
			{ select: select1, options: options1 },
			{ select: select2, options: options2 },
			{ select: logicSelect, options: logicOptions }  // Thêm logic options
		].forEach(({ select, options }) => {
			options.forEach(option => {
				const opt = document.createElement("option");
				opt.value = option;
				opt.textContent = option;
				select.appendChild(opt);
			});
		});

		// Set default values
		select0.value = 'market';
		select1.value = 'buy';
		select2.value = 'base_ccy';
		logicSelect.value = '>';  // Set default logic value

		row.innerHTML = `
			<td contenteditable="true">0</td>
			<td></td>
			<td contenteditable="true">0</td>
			<td contenteditable="true">0</td>
			<td contenteditable="true">cash</td>
			<td></td>
			<td></td>
			<td contenteditable="true">0</td>
			<td></td>
			<td><button class="delOrderRow">Del</button></td>
			<td><button class="actOrder">Act</button></td>
		`;

		// Append all selects
		row.querySelector("td:nth-child(2)").appendChild(logicSelect);  // Logic select
		row.querySelector("td:nth-child(6)").appendChild(select1);
		row.querySelector("td:nth-child(7)").appendChild(select0);
		row.querySelector("td:nth-child(9)").appendChild(select2);

		orderTableBody.appendChild(row);
	}




    // Clear order table
    function clearOrderTable() {
        const orderTableBody = document.getElementById("orderTableBody");
        orderTableBody.innerHTML = "";
    }

    // Save order table to JSON file
	function saveAsOrderTable() {
		try {
			const orderTableBody = document.getElementById("orderTableBody");
			const rows = Array.from(orderTableBody.rows);
			const orderData = rows.map(row => {
				return {
					order: parseInt(row.cells[0].textContent) || 0,
					logic: row.cells[1].querySelector('select').value,  // Lấy giá trị từ select
					targetPrice: parseFloat(row.cells[2].textContent) || 0,
					percentage: parseFloat(row.cells[3].textContent) || 0,
					tdMode: row.cells[4].textContent || '',
					side: row.cells[5].querySelector('select').value,
					ordType: row.cells[6].querySelector('select').value,
					sz: row.cells[7].textContent || '0',
					tgtCcy: row.cells[8].querySelector('select').value
				};
			});

			const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orderData, null, 2));
			const downloadAnchorNode = document.createElement('a');
			downloadAnchorNode.setAttribute("href", dataStr);
			downloadAnchorNode.setAttribute("download", "orders.json");
			document.body.appendChild(downloadAnchorNode);
			downloadAnchorNode.click();
			downloadAnchorNode.remove();
			showAlert("Order table saved successfully");
		} catch (err) {
			console.error("Error saving order table:", err);
			showAlert("Error saving order table");
		}
	}

    // Load order table from JSON file
	function loadOrderTable(file) {
		try {
			if (!file) {
				throw new Error("No file selected");
			}

			const reader = new FileReader();
			reader.onload = function(event) {
				try {
					const data = JSON.parse(event.target.result);
					const orderTableBody = document.getElementById("orderTableBody");
					if (!orderTableBody) {
						throw new Error("Order table body not found");
					}

					orderTableBody.innerHTML = "";
					data.forEach(order => {
						const row = document.createElement("tr");
						
						// Create all select elements
						const sideSelect = document.createElement("select");
						const ordTypeSelect = document.createElement("select");
						const tgtCcySelect = document.createElement("select");
						const logicSelect = document.createElement("select");

						// Add options for logic
						['>', '<', '='].forEach(option => {
							const opt = document.createElement("option");
							opt.value = option;
							opt.textContent = option;
							opt.selected = order.logic === option;
							logicSelect.appendChild(opt);
						});

						// Add options for other selects
						sideSelect.innerHTML = `
							<option value="buy" ${order.side === 'buy' ? 'selected' : ''}>buy</option>
							<option value="sell" ${order.side === 'sell' ? 'selected' : ''}>sell</option>
						`;
						ordTypeSelect.innerHTML = `
							<option value="market" ${order.ordType === 'market' ? 'selected' : ''}>market</option>
							<option value="limit" ${order.ordType === 'limit' ? 'selected' : ''}>limit</option>
						`;
						tgtCcySelect.innerHTML = `
							<option value="base_ccy" ${order.tgtCcy === 'base_ccy' ? 'selected' : ''}>base_ccy</option>
							<option value="quote_ccy" ${order.tgtCcy === 'quote_ccy' ? 'selected' : ''}>quote_ccy</option>
						`;

						row.innerHTML = `
							<td contenteditable="true">${order.order || 0}</td>
							<td></td>
							<td contenteditable="true">${order.targetPrice || 0}</td>
							<td contenteditable="true">${order.percentage || 0}</td>
							<td contenteditable="true">${order.tdMode || 'cash'}</td>
							<td></td>
							<td></td>
							<td contenteditable="true">${order.sz || 0}</td>
							<td></td>
							<td><button class="delOrderRow">Del</button></td>
							<td><button class="actOrder">Act</button></td>
						`;

						// Append all selects
						row.querySelector("td:nth-child(2)").appendChild(logicSelect);
						row.querySelector("td:nth-child(6)").appendChild(sideSelect);
						row.querySelector("td:nth-child(7)").appendChild(ordTypeSelect);
						row.querySelector("td:nth-child(9)").appendChild(tgtCcySelect);

						orderTableBody.appendChild(row);
					});
					showAlert("Order table loaded successfully");
				} catch (err) {
					console.error("Error parsing file:", err);
					showAlert("Error parsing file");
				}
			};
			reader.onerror = function() {
				showAlert("Error reading file");
			};
			reader.readAsText(file);
		} catch (err) {
			console.error("Error loading order table:", err);
			showAlert("Error loading order table");
		}
	}


	// Add row to condition table
	function addLowRow() {
		const lowTableBody = document.querySelector("#LowTable tbody");
		const currentRows = lowTableBody.rows.length;
		const newOrder = Math.floor(currentRows / 2) + 1;

		// Tạo 2 hàng mới
		for (let i = 0; i < 2; i++) {
			const row = document.createElement("tr");
			
			// Define options for all select elements
			const options0 = ['market', 'limit'];
			const options1 = ['buy', 'sell'];
			const options2 = ['base_ccy', 'quote_ccy'];
			const logicOptions = ['>', '<', '='];

			// Create all select elements
			const select0 = document.createElement("select");
			const select1 = document.createElement("select");
			const select2 = document.createElement("select");
			const logicSelect = document.createElement("select");

			// Populate all selects
			[
				{ select: select0, options: options0 },
				{ select: select1, options: options1 },
				{ select: select2, options: options2 },
				{ select: logicSelect, options: logicOptions }
			].forEach(({ select, options }) => {
				options.forEach(option => {
					const opt = document.createElement("option");
					opt.value = option;
					opt.textContent = option;
					select.appendChild(opt);
				});
			});

			// Set default values
			select0.value = 'market';
			select1.value = 'buy';
			select2.value = 'base_ccy';
			logicSelect.value = i === 0 ? '<' : '>';  // Set logic based on row index

			row.innerHTML = `
				<td contenteditable="true">${-newOrder}</td>
				<td></td>
				<td contenteditable="true">0</td>
				<td contenteditable="true">0</td>
				<td contenteditable="true">cash</td>
				<td></td>
				<td></td>
				<td contenteditable="true">0</td>
				<td></td>
				<td><button class="delOrderRow">Del</button></td>
				<td><button class="actOrder">Act</button></td>
			`;

			// Append all selects
			row.querySelector("td:nth-child(2)").appendChild(logicSelect);
			row.querySelector("td:nth-child(6)").appendChild(select1);
			row.querySelector("td:nth-child(7)").appendChild(select0);
			row.querySelector("td:nth-child(9)").appendChild(select2);

			lowTableBody.appendChild(row);
		}
	}


    // Clear condition table
    function clearLowTable() {
        const lowTableBody = document.querySelector("#LowTable tbody");
        lowTableBody.innerHTML = "";
    }

    // Save condition table to JSON file
	function saveAsLowTable() {
		const lowTableBody = document.querySelector("#LowTable tbody");
		const rows = Array.from(lowTableBody.rows);
		const lowData = rows.map(row => {
			return {
				order: parseInt(row.cells[0].textContent),
				logic: row.cells[1].textContent,
				targetPrice: parseFloat(row.cells[2].textContent),
				percentage: parseFloat(row.cells[3].textContent),
				tdMode: row.cells[4].textContent,
				side: row.cells[5].querySelector('select').value,
				ordType: row.cells[6].querySelector('select').value,
				sz: row.cells[7].textContent,
				tgtCcy: row.cells[8].querySelector('select').value
			};
		});
		const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lowData));
		const downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute("href", dataStr);
		downloadAnchorNode.setAttribute("download", "conditions.json");
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}
    // Save condition table to JSON file with better formatting and error handling
    function saveAsLowTable() {
        try {
            const lowTableBody = document.querySelector("#LowTable tbody");
            if (!lowTableBody) {
                throw new Error("Low table body not found");
            }

            const rows = Array.from(lowTableBody.rows);
            const lowData = rows.map(row => {
                return {
                    order: parseInt(row.cells[0].textContent) || 0,
                    logic: row.cells[1].querySelector('select')?.value || '',
                    targetPrice: parseFloat(row.cells[2].textContent) || 0, 
                    percentage: parseFloat(row.cells[3].textContent) || 0,
                    tdMode: row.cells[4].textContent || '',
                    side: row.cells[5].querySelector('select')?.value || '',
                    ordType: row.cells[6].querySelector('select')?.value || '',
                    sz: row.cells[7].textContent || '0',
                    tgtCcy: row.cells[8].querySelector('select')?.value || ''
                };
            });

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lowData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "conditions.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            showAlert("Low table saved successfully");
        } catch (err) {
            console.error("Error saving low table:", err);
            showAlert("Error saving low table");
        }
    }


    // Load condition table from JSON file
	function loadLowTable(file) {
		const reader = new FileReader();
		reader.onload = function(event) {
			try {
				const data = JSON.parse(event.target.result);
				const lowTableBody = document.querySelector("#LowTable tbody");
				lowTableBody.innerHTML = "";
				
				data.forEach(condition => {
					const row = document.createElement("tr");
					
					// Create all select elements
					const sideSelect = document.createElement("select");
					const ordTypeSelect = document.createElement("select");
					const tgtCcySelect = document.createElement("select");
					const logicSelect = document.createElement("select");

					// Add options for logic
					['>', '<', '='].forEach(option => {
						const opt = document.createElement("option");
						opt.value = option;
						opt.textContent = option;
						opt.selected = condition.logic === option;
						logicSelect.appendChild(opt);
					});

					// Add options for other selects
					sideSelect.innerHTML = `
						<option value="buy" ${condition.side === 'buy' ? 'selected' : ''}>buy</option>
						<option value="sell" ${condition.side === 'sell' ? 'selected' : ''}>sell</option>
					`;
					ordTypeSelect.innerHTML = `
						<option value="market" ${condition.ordType === 'market' ? 'selected' : ''}>market</option>
						<option value="limit" ${condition.ordType === 'limit' ? 'selected' : ''}>limit</option>
					`;
					tgtCcySelect.innerHTML = `
						<option value="base_ccy" ${condition.tgtCcy === 'base_ccy' ? 'selected' : ''}>base_ccy</option>
						<option value="quote_ccy" ${condition.tgtCcy === 'quote_ccy' ? 'selected' : ''}>quote_ccy</option>
					`;

					row.innerHTML = `
						<td contenteditable="true">${condition.order || 0}</td>
						<td></td>
						<td contenteditable="true">${condition.targetPrice || 0}</td>
						<td contenteditable="true">${condition.percentage || 0}</td>
						<td contenteditable="true">${condition.tdMode || 'cash'}</td>
						<td></td>
						<td></td>
						<td contenteditable="true">${condition.sz || 0}</td>
						<td></td>
						<td><button class="delLowRow">Del</button></td>
						<td><button class="actLow">Act</button></td>
					`;

					// Append all selects
					row.querySelector("td:nth-child(2)").appendChild(logicSelect);
					row.querySelector("td:nth-child(6)").appendChild(sideSelect);
					row.querySelector("td:nth-child(7)").appendChild(ordTypeSelect);
					row.querySelector("td:nth-child(9)").appendChild(tgtCcySelect);

					lowTableBody.appendChild(row);
				});
				showAlert("Low table loaded successfully");
			} catch (err) {
				console.error("Error loading low table:", err);
				showAlert("Error loading low table: " + err.message);
			}
		};
		reader.onerror = function() {
			showAlert("Error reading file");
		};
		reader.readAsText(file);
	}


    // Evaluate conditions and execute actions
    async function checkConditions() {
        // Thêm kiểm tra target table trước
        const targetTableBody = document.querySelector("#targetTable tbody");
        const targetRows = Array.from(targetTableBody.rows);
        
        for (const targetRow of targetRows) {
            const selectedTable = targetRow.cells[0].querySelector('select').value;
            const rowNumber = parseInt(targetRow.cells[1].textContent);
            const orderChange = parseInt(targetRow.cells[2].textContent);
            const tokenNameTarget = targetRow.cells[3].textContent;
            const logic = targetRow.cells[5].querySelector('select').value;
            const targetPrice = parseFloat(targetRow.cells[6].textContent);

            // Cập nhật current price trong target table
            const url = `https://api.binance.com/api/v3/ticker/price?symbol=${tokenNameTarget}USDT`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    const currentPrice = parseFloat(data.price);
                    targetRow.cells[4].textContent = currentPrice.toFixed(8);
                    
                    // Kiểm tra điều kiện logic sau khi có giá
                    if (evaluateCondition(logic, targetPrice, currentPrice)) {
                        // Tìm và cập nhật order trong bảng tương ứng
                        const tableToUpdate = selectedTable === 'Order Table' ? 
                            document.getElementById("orderTableBody") : 
                            document.querySelector("#LowTable tbody");

                        const rowToUpdate = Array.from(tableToUpdate.rows)[rowNumber - 1];
                        if (rowToUpdate) {
                            const currentOrder = parseInt(rowToUpdate.cells[0].textContent);
							Array.from(tableToUpdate.rows).forEach(row => {
								row.cells[2].textContent = varTokenPrice;
							});
                            rowToUpdate.cells[0].textContent = orderChange;
                            showAlert(`Updated order in ${selectedTable} row ${rowNumber} to ${orderChange}`);
                            targetRow.cells[1].textContent = -rowNumber; // Gán rowNumber về -rowNumber sau khi thực hiện xong
                        }
                    }
                })
                .catch(error => showAlert("Error fetching token price: " + error.message));
        }

        // Kiểm tra Order Table
        const orderTableBody = document.getElementById("orderTableBody");
        const orderRows = Array.from(orderTableBody.rows);
        orderRows.forEach(row => {
            const order = parseInt(row.cells[0].textContent);
            const logic = row.cells[1].querySelector('select').value;
            const targetPrice = parseFloat(row.cells[2].textContent);
            const percentageValue = parseFloat(row.cells[3].textContent) / 100;
            const realPrice = targetPrice * (1 + percentageValue);
            
            if (order > 0 && evaluateCondition(logic, realPrice, varTokenPrice)) {
                executeOrder({
                    apiKey: apiKeyInput.value,
                    secretKey: secretKeyInput.value,
                    passphrase: passphraseInput.value,
                    tdMode: row.cells[4].textContent,
                    side: row.cells[5].querySelector('select').value,
                    ordType: row.cells[6].querySelector('select').value,
                    sz: row.cells[7].textContent,
                    tgtCcy: row.cells[8].querySelector('select').value
                });
                updateOrderStatus(row, orderTableBody);
            }
        });

        // Kiểm tra Low Table
        const lowTableBody = document.querySelector("#LowTable tbody");
        const lowRows = Array.from(lowTableBody.rows);
        
        for (const row of lowRows) {
            const order = parseInt(row.cells[0].textContent);
            const logic = row.cells[1].querySelector('select').value;
            const targetPrice = parseFloat(row.cells[2].textContent);
            const percentageValue = parseFloat(row.cells[3].textContent) / 100;
            const realPrice = targetPrice * (1 + percentageValue);
            
            if (order > 0 && evaluateCondition(logic, realPrice, varTokenPrice)) {
				thongBaoTaget();
				if (row.cells[5].querySelector('select').value === 'sell') {
					try {
						const balance = await getTokenBalance();
						if (balance > 0) {
							executeOrder({
								apiKey: apiKeyInput.value,
								secretKey: secretKeyInput.value,
								passphrase: passphraseInput.value,
								tdMode: row.cells[4].textContent,
								side: row.cells[5].querySelector('select').value,
								ordType: row.cells[6].querySelector('select').value,
								sz: balance,
								tgtCcy: row.cells[8].querySelector('select').value
							});
							
						} else {
							console.error("Số dư không đủ để thực hiện lệnh bán!");
						}
					} catch (error) {
						console.error("Lỗi khi lấy số dư:", error);
					}
				} else {
					
					executeOrder({
						apiKey: apiKeyInput.value,
						secretKey: secretKeyInput.value,
						passphrase: passphraseInput.value,
						tdMode: row.cells[4].textContent,
						side: row.cells[5].querySelector('select').value,
						ordType: row.cells[6].querySelector('select').value,
						sz: row.cells[7].textContent,
						tgtCcy: row.cells[8].querySelector('select').value
					});
					
				}
				console.log('Checking order execution...');
				showAlert('Order condition met - executing order');
                updateOrderStatus(row,lowTableBody);
            }
			
            if (document.getElementById('changeMin').checked && varTokenPrice < targetPrice) {
                updateTargetPrice(row);
            }
			
        };
    }
	function updateOrderStatus(row, TableBody) {
        try {
            // Kiểm tra tham số đầu vào
            if (!row || !TableBody) {
                console.error("Missing parameters:", { row, TableBody });
                return;
            }

            // Debug thông tin row
            console.log("Current row:", {
                rowContent: row.innerHTML,
                firstCell: row.cells[0]?.textContent
            });

            // Lấy và kiểm tra order value
            const order = parseInt(row.cells[0]?.textContent);
            if (isNaN(order)) {
                console.error("Invalid order value:", row.cells[0]?.textContent);
                return;
            }
            console.log("Processing order:", order);

            // Kiểm tra TableBody
            if (!TableBody.rows) {
                console.error("Invalid TableBody:", TableBody);
                return;
            }

            // Tìm các hàng có order ngược dấu
            const opposingOrders = Array.from(TableBody.rows).filter(r => {
                if (!r.cells[0]) {
                    console.warn("Row missing first cell:", r);
                    return false;
                }
                const opposingOrder = parseInt(r.cells[0].textContent);
                const isOpposing = !isNaN(opposingOrder) && opposingOrder === -order;
                if (isOpposing) {
                    console.log("Found opposing order:", opposingOrder);
                }
                return isOpposing;
            });

            // Cập nhật các order ngược dấu
            opposingOrders.forEach(r => {
                try {
                    const currentOrder = parseInt(r.cells[0].textContent);
                    const newValue = Math.abs(currentOrder);
                    r.cells[0].textContent = newValue; // Sử dụng textContent thay vì innerHTML
                    console.log("Updated opposing order:", {
                        from: currentOrder,
                        to: newValue,
                        cell: r.cells[0]
                    });
                } catch (err) {
                    console.error("Error updating opposing order:", err);
                }
            });

            // Cập nhật order hiện tại
            const newValue = -order;
            row.cells[0].textContent = newValue; // Sử dụng textContent thay vì innerHTML
            console.log("Updated current order:", {
                from: order,
                to: newValue,
                cell: row.cells[0]
            });

            // Thông báo hoàn thành
            showAlert("Orders updated successfully");

        } catch (err) {
            console.error("Error in updateOrderStatus:", err);
            showAlert("Error updating orders: " + err.message);
        }
    }

    function updateTargetPrice(row) {
        row.cells[2].textContent = varTokenPrice;
    }

    function evaluateCondition(logic, targetPrice, currentPrice) {
        switch (logic) {
            case ">":
                return currentPrice > targetPrice;
            case "<":
                return currentPrice < targetPrice;
            case "=":
                return currentPrice === targetPrice;
            default:
                console.error("Invalid logic operator:", logic);
                return false;
        }
    }
    /*
    async function executeOrder(order) {
        const timestamp = new Date().toISOString();
        addToHistory({
            timestamp: new Date().toLocaleString(),
            type: order.side,
            price: varTokenPrice,
            amount: order.sz,
            token: tokenName,
            status: 'Thành công'
        });
    }
    */
    async function executeOrder(order) {
        const apiUrl = 'https://www.okx.com';

        // Thiết lập các headers cần thiết
        const timestamp = new Date().toISOString();
        const method = 'POST';
        const path = '/api/v5/trade/order';
        const body = JSON.stringify({
            instId: tokenName+'-USDT',     // Mã cặp giao dịch (ví dụ: BTC-USDT)
            tdMode: order.tdMode,     // Chế độ giao dịch (cash, cross, isolated)
            side: order.side,         // Mua (buy) hoặc bán (sell)
            ordType: order.ordType,   // Kiểu lệnh (limit, market, ...)
            sz: order.sz,             // Kích thước giao dịch
            tgtCcy: order.tgtCcy      // Đơn vị giao dịch (base_ccy hoặc quote_ccy)
        });
        console.log(body);  // Kiểm tra kết quả JSON đã được tạo đúng
        // Tạo pre-hash string theo hướng dẫn của OKX
        const preHashString = `${timestamp}${method}${path}${body}`;

        // Tạo chữ ký
        const signature = await createSignature(preHashString, order.secretKey);

        // Headers cho request
        const headers = {
            'Content-Type': 'application/json',
            'OK-ACCESS-KEY': order.apiKey,         // API Key
            'OK-ACCESS-SIGN': signature,          // Chữ ký được tạo
            'OK-ACCESS-TIMESTAMP': timestamp,     // Thời gian hiện tại (ISO 8601)
            'OK-ACCESS-PASSPHRASE': order.passphrase // Passphrase của tài khoản
        };

        try {
            const response = await fetch(apiUrl + path, {
                method: method,
                headers: headers,
                body: body
            });

            const result = await response.json();

            if (response.ok) {
                // Thêm lệnh vào lịch sử
                addToHistory({
                    timestamp: new Date().toLocaleString(),
                    type: order.side,
                    price: varTokenPrice,
                    amount: order.sz,
                    token: tokenName,
                    status: 'Thành công'
                });
                
                showAlert('Order executed successfully:'+ result);
                console.log('Order executed successfully: ', result);
                thongBaoTaget();
            } else {
                // Thêm lệnh thất bại vào lịch sử
                addToHistory({
                    timestamp: new Date().toLocaleString(),
                    type: order.side,
                    price: varTokenPrice,
                    amount: order.sz,
                    token: tokenName,
                    status: 'Thất bại'
                });
                
                showAlert('Error executing order:'+ result);
                console.error('Error: ', result);
            }
        } catch (error) {
            // Thêm lỗi vào lịch sử
            addToHistory({
                timestamp: new Date().toLocaleString(),
                type: order.side,
                price: varTokenPrice,
                amount: order.sz,
                token: tokenName,
                status: 'Lỗi: ' + error.message
            });
            
            showAlert('Network or unexpected error:'+ error);
        }
    }

    async function createSignature(dataToSign, secretKey) {
        const encoder = new TextEncoder();
        const key = encoder.encode(secretKey);
        const data = encoder.encode(dataToSign);

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            key,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }
	//Lấy số lượng cụ thể token = 'BTC'; Token bạn muốn kiểm tra số dư
	async function getTokenBalance() {
		const baseUrl = 'https://www.okx.com';
		const endpoint = `/api/v5/account/balance?ccy=${tokenName}`;
		const method = 'GET';
		const timestamp = new Date().toISOString();
		const dataToSign = `${timestamp}${method}${endpoint}`;
		
		// Tạo chữ ký
		const signature = await createSignature(dataToSign, secretKeyInput.value);

		// Header yêu cầu
		const headers = {
			'OK-ACCESS-KEY': apiKeyInput.value,
			'OK-ACCESS-SIGN': signature,
			'OK-ACCESS-TIMESTAMP': timestamp,
			'OK-ACCESS-PASSPHRASE': passphraseInput.value,
		};

		// Gửi request đến API
		const response = await fetch(baseUrl + endpoint, { method, headers });
		const data = await response.json();

		// Xử lý kết quả
		if (data.code === '0') {
			const balanceDetails = data.data[0].details.find(detail => detail.ccy === tokenName);
			return balanceDetails ? parseFloat(balanceDetails.cashBal) : 0;
		} else {
			throw new Error(`Failed to fetch balance: ${data.msg}`);
		}
	}

    // Thêm hàm mới để xử lý lịch sử
    function addToHistory(orderInfo) {
        const historyDiv = document.getElementById('orderHistory');
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            ${orderInfo.timestamp} - 
            ${orderInfo.type.toUpperCase()} ${orderInfo.amount} ${orderInfo.token} 
            @ ${orderInfo.price} USDT - 
            ${orderInfo.status}
        `;
        historyDiv.insertBefore(historyItem, historyDiv.firstChild);
    }

    // Thêm các event listener cho nút điều khiển lịch sử
    document.getElementById('clearHistory').addEventListener('click', () => {
        document.getElementById('orderHistory').innerHTML = '';
    });

    document.getElementById('saveHistory').addEventListener('click', () => {
        const historyDiv = document.getElementById('orderHistory');
        const historyText = Array.from(historyDiv.children)
            .map(item => item.textContent.trim())
            .join('\n');
        
        const blob = new Blob([historyText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trading_history_${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    });

    // Add event listeners
    saveApiKeyButton.addEventListener("click", saveApiKey);
    saveAsApiKeyButton.addEventListener("click", saveAsApiKey);
    loadApiKeyButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", event => loadApiKey(event.target.files[0]));

    clearOrderTableButton.addEventListener("click", clearOrderTable);
    addOrderRowButton.addEventListener("click", addOrderRow);
    saveAsOrderTableButton.addEventListener("click", saveAsOrderTable);
    loadOrderTableInput.addEventListener("change", event => loadOrderTable(event.target.files[0]));

    clearLowTableButton.addEventListener("click", clearLowTable);
    addLowRowButton.addEventListener("click", addLowRow);
    saveAsLowTableButton.addEventListener("click", saveAsLowTable);
    loadLowTableInput.addEventListener("change", event => loadLowTable(event.target.files[0]));

    
    const intervalInput = document.getElementById("updateInterval");
    const saveIntervalButton = document.getElementById("saveInterval");

    saveIntervalButton.addEventListener("click", () => {
        const newInterval = parseInt(intervalInput.value);
        if (!isNaN(newInterval) && newInterval > 0) {
            updateInterval = newInterval;
            /*
            clearInterval(priceUpdateTimer);
            priceUpdateTimer = setInterval(() => {
                updateTokenPrice();
                checkConditions();
            }, updateInterval);
            */
            showAlert("Update interval changed to " + newInterval + "ms");
        } else {
            showAlert("Please enter a valid interval");
        }
    });

    
	
	// thông báo
	function showAlert(message) {
            const alertBox = document.createElement('div');
            alertBox.className = 'custom-alert';
            alertBox.textContent = message;
            document.body.appendChild(alertBox);

            // Hiển thị alert
            alertBox.style.display = 'block';
			thongBaoTaget();

            // Tự động ẩn sau 1 giây
            setTimeout(() => {
                alertBox.style.display = 'none';
                alertBox.remove(); // Xóa phần tử khỏi DOM
            }, 1000);
        }
	function thongBaoTaget() {
		try {
			const context = new (window.AudioContext || window.webkitAudioContext)();
			// Kiểm tra xem browser có hỗ trợ Web Audio API không
			if (!context) {
				throw new Error('Web Audio API not supported');
			}
			
			// Tạo nguồn âm thanh
			const oscillator = context.createOscillator();
			const gainNode = context.createGain();

			// Kết nối các node
			oscillator.connect(gainNode);
			gainNode.connect(context.destination);

			// Kiểu sóng tạo âm thanh
			oscillator.type = 'sine';

			// Tần số cơ bản cho tiếng gõ cửa (khoảng 100-200Hz)
			const baseFrequency = 150;
			
			// Thời gian bắt đầu
			const startTime = context.currentTime;

			// Thời gian phát âm thanh tổng cộng
			const playDuration = 0.5; // 0.5 giây

			// Tạo hiệu ứng tiếng gõ cửa
			oscillator.frequency.setValueAtTime(baseFrequency, startTime);
			oscillator.frequency.setValueAtTime(baseFrequency, startTime + 0.1);
			oscillator.frequency.setValueAtTime(baseFrequency, startTime + 0.2);

			// Điều chỉnh âm lượng để tạo hiệu ứng gõ cửa
			gainNode.gain.setValueAtTime(0, startTime);
			gainNode.gain.linearRampToValueAtTime(1, startTime + 0.01);
			gainNode.gain.linearRampToValueAtTime(0, startTime + 0.1);
			gainNode.gain.linearRampToValueAtTime(1, startTime + 0.2);
			gainNode.gain.linearRampToValueAtTime(0, startTime + 0.3);

			// Bắt đầu và kết thúc âm thanh
			oscillator.start(startTime);
			oscillator.stop(startTime + playDuration);
		} catch (error) {
			console.error('Error playing sound:', error);
		}
	}

    // Event delegation for dynamically created rows
    document.addEventListener("click", function(event) {
        if (event.target.classList.contains("delOrderRow")) {
            event.target.closest("tr").remove();
        } else if (event.target.classList.contains("actOrder")) {
            const row = event.target.closest("tr");
            executeOrder({
                    apiKey: apiKeyInput.value,
                    secretKey: secretKeyInput.value,
                    passphrase: passphraseInput.value,
                    tdMode: row.cells[4].textContent,
                    side: row.cells[5].querySelector('select').value,
                    ordType: row.cells[6].querySelector('select').value,
                    sz: row.cells[7].textContent,
                    tgtCcy: row.cells[8].querySelector('select').value
            });
        } else if (event.target.classList.contains("delLowRow")) {
            event.target.closest("tr").remove();
        } else if (event.target.classList.contains("actLow")) {
            const row = event.target.closest("tr");
            executeOrder({
					apiKey: apiKeyInput.value,
                    secretKey: secretKeyInput.value,
                    passphrase: passphraseInput.value,
                    tdMode: row.cells[4].textContent,
                    side: row.cells[5].querySelector('select').value,
                    ordType: row.cells[6].querySelector('select').value,
                    sz: row.cells[7].textContent,
                    tgtCcy: row.cells[8].querySelector('select').value
            });
        }
    });

    // Thêm event listener cho toggleSwitch
    const toggleSwitch = document.getElementById("toggleSwitch");
    toggleSwitch.addEventListener("change", function() {
        isTradeEnabled = this.checked;
        showAlert(isTradeEnabled ? "Trading enabled" : "Trading disabled");
    });

    // Thêm hàm xử lý cho Target table
    function addTargetRow() {
        const targetTableBody = document.querySelector("#targetTable tbody");
        const row = document.createElement("tr");

        // Tạo select cho cột Table
        const tableSelect = document.createElement("select");
        const tableOptions = ['Order Table', 'Low Table'];
        tableOptions.forEach(option => {
            const opt = document.createElement("option");
            opt.value = option;
            opt.textContent = option;
            tableSelect.appendChild(opt);
        });

        // Tạo select cho cột Logic
        const logicSelect = document.createElement("select");
        const logicOptions = ['>', '<', '='];
        logicOptions.forEach(option => {
            const opt = document.createElement("option");
            opt.value = option;
            opt.textContent = option;
            logicSelect.appendChild(opt);
        });

        row.innerHTML = `
            <td></td>
            <td contenteditable="true">-1</td>
            <td contenteditable="true">0</td>
            <td contenteditable="true">BTC</td>
            <td>${varTokenPrice || '0'}</td>
            <td></td>
            <td contenteditable="true">0</td>
            <td><button class="delTargetRow">Del</button></td>
        `;

        // Thêm các select vào các cột tương ứng
        row.querySelector("td:nth-child(1)").appendChild(tableSelect);
        row.querySelector("td:nth-child(6)").appendChild(logicSelect);

        targetTableBody.appendChild(row);
    }

    function clearTargetTable() {
        const targetTableBody = document.querySelector("#targetTable tbody");
        targetTableBody.innerHTML = "";
    }

    function saveAsTargetTable() {
        const targetTableBody = document.querySelector("#targetTable tbody");
        const rows = Array.from(targetTableBody.rows);
        const targetData = rows.map(row => {
            return {
                table: row.cells[0].querySelector('select').value,
                row: parseInt(row.cells[1].textContent),
                orderChange: parseInt(row.cells[2].textContent),
                tokenName: row.cells[3].textContent,
                currentPrice: parseFloat(row.cells[4].textContent),
                logic: row.cells[5].querySelector('select').value,
                targetPrice: parseFloat(row.cells[6].textContent)
            };
        });

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(targetData));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "targets.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    function loadTargetTable(file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const data = JSON.parse(event.target.result);
            const targetTableBody = document.querySelector("#targetTable tbody");
            targetTableBody.innerHTML = "";
            
            data.forEach(target => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td></td>
                    <td contenteditable="true">${target.row}</td>
                    <td contenteditable="true">${target.orderChange}</td>
                    <td contenteditable="true">${target.tokenName}</td>
                    <td>${target.currentPrice}</td>
                    <td></td>
                    <td contenteditable="true">${target.targetPrice}</td>
                    <td><button class="delTargetRow">Del</button></td>
                `;

                // Tạo và set giá trị cho các select
                const tableSelect = document.createElement("select");
                ['Order Table', 'Low Table'].forEach(option => {
                    const opt = document.createElement("option");
                    opt.value = option;
                    opt.textContent = option;
                    opt.selected = option === target.table;
                    tableSelect.appendChild(opt);
                });

                const logicSelect = document.createElement("select");
                ['>', '<', '='].forEach(option => {
                    const opt = document.createElement("option");
                    opt.value = option;
                    opt.textContent = option;
                    opt.selected = option === target.logic;
                    logicSelect.appendChild(opt);
                });

                row.querySelector("td:nth-child(1)").appendChild(tableSelect);
                row.querySelector("td:nth-child(6)").appendChild(logicSelect);

                targetTableBody.appendChild(row);
            });
        };
        reader.readAsText(file);
    }

    // Thêm event listeners cho Target table
    clearTargetTableButton.addEventListener("click", clearTargetTable);
    addTargetRowButton.addEventListener("click", addTargetRow);
    saveAsTargetTableButton.addEventListener("click", saveAsTargetTable);
    loadTargetTableInput.addEventListener("change", event => loadTargetTable(event.target.files[0]));

    // Thêm xử lý cho nút Del trong Target table
    document.addEventListener("click", function(event) {
        if (event.target.classList.contains("delTargetRow")) {
            event.target.closest("tr").remove();
        }
    });

    // Sửa phần xử lý sự kiện cho nút Load và input file
    loadOrderTableButton.addEventListener("click", () => {
        fileInputOrderTable.value = ''; // Reset giá trị của input file
        fileInputOrderTable.click();
    });

    fileInputOrderTable.addEventListener("change", event => {
        if (event.target.files.length > 0) {
            loadOrderTable(event.target.files[0]);
        }
    });

    // Tương tự cho Low Table và Target Table
    loadLowTableButton.addEventListener("click", () => {
        fileInputLowTable.value = ''; // Reset giá trị của input file
        fileInputLowTable.click();
    });

    loadTargetTableButton.addEventListener("click", () => {
        fileInputTargetTable.value = ''; // Reset giá trị của input file
        fileInputTargetTable.click();
    });

    fileInputLowTable.addEventListener("change", event => {
        if (event.target.files.length > 0) {
            loadLowTable(event.target.files[0]);
        }
    });

    fileInputTargetTable.addEventListener("change", event => {
        if (event.target.files.length > 0) {
            loadTargetTable(event.target.files[0]);
        }
    });
});
