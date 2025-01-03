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

	let tokenName = '';
    let varTokenPrice = 0;
    let orders = [];
    let conditions = [];

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
            const data = JSON.parse(event.target.result);
            apiKeyInput.value = data.apiKey;
            secretKeyInput.value = data.secretKey;
            passphraseInput.value = data.passphrase;
        };
        reader.readAsText(file);
    }

    // Fetch and update token price
	async function updateTokenPrice() {
		tokenName = tokenNameInput.value.trim().toUpperCase();  // Chuyển đổi thành chữ hoa và loại bỏ khoảng trắng
		if (!tokenName) {
			showAlert("Please enter a valid token name");
			return;
		}

		const url = `https://api.binance.com/api/v3/ticker/price?symbol=${tokenName}USDT`;

		fetch(url)
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then(data => {
				varTokenPrice = parseFloat(data.price);
				tokenPriceSpan.textContent = varTokenPrice.toFixed(8); // Hiển thị giá với 2 chữ số thập phân
			})
			.catch(error => showAlert("Error fetching token price: " + error.message));
			checkConditions();
	}


		// Add row to order table
	function addOrderRow() {
		const orderTableBody = document.getElementById("orderTableBody");
		const row = document.createElement("tr");

		// Define options for the select elements
		const options0 = ['market', 'limit'];
		const options1 = ['buy', 'sell'];
		const options2 = ['base_ccy', 'quote_ccy'];

		// Create select elements for the 'tgtCcy' columns
		const select0 = document.createElement("select");
		const select1 = document.createElement("select");
		const select2 = document.createElement("select");
		
		// Populate select0 with options1
		options0.forEach(option => {
			const opt0 = document.createElement("option");
			opt0.value = option; // Correctly assign option value
			opt0.textContent = option; // Correctly assign option display text
			select0.appendChild(opt0);
		});

		// Populate select1 with options1
		options1.forEach(option => {
			const opt1 = document.createElement("option");
			opt1.value = option; // Correctly assign option value
			opt1.textContent = option; // Correctly assign option display text
			select1.appendChild(opt1);
		});

		// Populate select2 with options2
		options2.forEach(option => {
			const opt2 = document.createElement("option");
			opt2.value = option; // Correctly assign option value
			opt2.textContent = option; // Correctly assign option display text
			select2.appendChild(opt2);
		});

		// Set default value for both selects
		select0.value = 'market';
		select1.value = 'buy';
		select2.value = 'base_ccy';

		// Append the row with the required columns
		row.innerHTML = `
			<td contenteditable="true">0</td>
			<td contenteditable="true"><</td>
			<td contenteditable="true">0</td>
			<td contenteditable="true">cash</td>
			<td></td> <!-- Placeholder for the first select -->
			<td></td> <!-- Placeholder for the first select -->
			<td contenteditable="true">0</td>
			<td></td> <!-- Placeholder for the second select -->
			<td><button class="delOrderRow">Del</button></td>
			<td><button class="actOrder">Act</button></td>
		`;

		// Append the select elements to the correct cells
		row.querySelector("td:nth-child(5)").appendChild(select1);
		row.querySelector("td:nth-child(6)").appendChild(select0);
		row.querySelector("td:nth-child(8)").appendChild(select2);

		// Append the row to the table body
		orderTableBody.appendChild(row);
	}




    // Clear order table
    function clearOrderTable() {
        const orderTableBody = document.getElementById("orderTableBody");
        orderTableBody.innerHTML = "";
    }

    // Save order table to JSON file
	function saveAsOrderTable() {
		const orderTableBody = document.getElementById("orderTableBody");
		const rows = Array.from(orderTableBody.rows);
		const orderData = rows.map(row => {
			return {
				order: parseInt(row.cells[0].textContent),
				logic: row.cells[1].textContent,
				targetPrice: parseFloat(row.cells[2].textContent),
				tdMode: row.cells[3].textContent,
				side: row.cells[4].querySelector('select') ? row.cells[4].querySelector('select').value : row.cells[4].textContent,  // Lấy giá trị từ select
				ordType: row.cells[5].querySelector('select') ? row.cells[5].querySelector('select').value : row.cells[5].textContent,  // Lấy giá trị từ select
				sz: row.cells[6].textContent,
				tgtCcy: row.cells[7].querySelector('select') ? row.cells[7].querySelector('select').value : row.cells[7].textContent // Lấy giá trị từ select
			};
		});
		const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orderData));
		const downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute("href", dataStr);
		downloadAnchorNode.setAttribute("download", "orders.json");
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}


    // Load order table from JSON file
	function loadOrderTable(file) {
		const reader = new FileReader();
		reader.onload = function(event) {
			const data = JSON.parse(event.target.result);
			const orderTableBody = document.getElementById("orderTableBody");
			orderTableBody.innerHTML = "";
			data.forEach(order => {
				const row = document.createElement("tr");
				row.innerHTML = `
					<td contenteditable="true">${order.order}</td>
					<td contenteditable="true">${order.logic}</td>
					<td contenteditable="true">${order.targetPrice}</td>
					<td contenteditable="true">${order.tdMode}</td>
					<td></td> <!-- Placeholder for the first select -->
					<td></td> <!-- Placeholder for the second select -->
					<td contenteditable="true">${order.sz}</td>
					<td></td> <!-- Placeholder for the third select -->
					<td><button class="delOrderRow">Del</button></td>
					<td><button class="actOrder">Act</button></td>
				`;

				// Đặt giá trị cho các select từ dữ liệu đã lưu
				row.querySelector("td:nth-child(5)").innerHTML = `<select><option value="buy" ${order.side === 'buy' ? 'selected' : ''}>buy</option><option value="sell" ${order.side === 'sell' ? 'selected' : ''}>sell</option></select>`;
				row.querySelector("td:nth-child(6)").innerHTML = `<select><option value="market" ${order.ordType === 'market' ? 'selected' : ''}>market</option><option value="limit" ${order.ordType === 'limit' ? 'selected' : ''}>limit</option></select>`;
				row.querySelector("td:nth-child(8)").innerHTML = `<select><option value="base_ccy" ${order.tgtCcy === 'base_ccy' ? 'selected' : ''}>base_ccy</option><option value="quote_ccy" ${order.tgtCcy === 'quote_ccy' ? 'selected' : ''}>quote_ccy</option></select>`;

				orderTableBody.appendChild(row);
			});
		};
		reader.readAsText(file);
	}


	// Add row to condition table
	function addLowRow() {
		const lowTableBody = document.querySelector("#LowTable tbody");
        const row = document.createElement("tr");

		// Define options for the select elements
		const options0 = ['market', 'limit'];
		const options1 = ['buy', 'sell'];
		const options2 = ['base_ccy', 'quote_ccy'];

		// Create select elements for the 'tgtCcy' columns
		const select0 = document.createElement("select");
		const select1 = document.createElement("select");
		const select2 = document.createElement("select");
		
		// Populate select0 with options1
		options0.forEach(option => {
			const opt0 = document.createElement("option");
			opt0.value = option; // Correctly assign option value
			opt0.textContent = option; // Correctly assign option display text
			select0.appendChild(opt0);
		});

		// Populate select1 with options1
		options1.forEach(option => {
			const opt1 = document.createElement("option");
			opt1.value = option; // Correctly assign option value
			opt1.textContent = option; // Correctly assign option display text
			select1.appendChild(opt1);
		});

		// Populate select2 with options2
		options2.forEach(option => {
			const opt2 = document.createElement("option");
			opt2.value = option; // Correctly assign option value
			opt2.textContent = option; // Correctly assign option display text
			select2.appendChild(opt2);
		});

		// Set default value for both selects
		select0.value = 'market';
		select1.value = 'buy';
		select2.value = 'base_ccy';

		// Append the row with the required columns
		row.innerHTML = `
			<td contenteditable="true">0</td>
			<td contenteditable="true"><</td>
			<td contenteditable="true">0</td>
			<td contenteditable="true">cash</td>
			<td></td> <!-- Placeholder for the first select -->
			<td></td> <!-- Placeholder for the first select -->
			<td contenteditable="true">0</td>
			<td></td> <!-- Placeholder for the second select -->
			<td><button class="delOrderRow">Del</button></td>
			<td><button class="actOrder">Act</button></td>
		`;

		// Append the select elements to the correct cells
		row.querySelector("td:nth-child(5)").appendChild(select1);
		row.querySelector("td:nth-child(6)").appendChild(select0);
		row.querySelector("td:nth-child(8)").appendChild(select2);

		// Append the row to the table body
		lowTableBody.appendChild(row);
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
				tdMode: row.cells[3].textContent,
				side: row.cells[4].querySelector('select') ? row.cells[4].querySelector('select').value : row.cells[4].textContent,  // Lấy giá trị từ select
				ordType: row.cells[5].querySelector('select') ? row.cells[5].querySelector('select').value : row.cells[5].textContent,  // Lấy giá trị từ select
				sz: row.cells[6].textContent,
				tgtCcy: row.cells[7].querySelector('select') ? row.cells[7].querySelector('select').value : row.cells[7].textContent // Lấy giá trị từ select
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


    // Load condition table from JSON file
	function loadLowTable(file) {
		const reader = new FileReader();
		reader.onload = function(event) {
			const data = JSON.parse(event.target.result);
			const lowTableBody = document.querySelector("#LowTable tbody");
			lowTableBody.innerHTML = "";
			data.forEach(condition => {
				const row = document.createElement("tr");
				row.innerHTML = `
					<td contenteditable="true">${condition.order}</td>
					<td contenteditable="true">${condition.logic}</td>
					<td contenteditable="true">${condition.targetPrice}</td>
					<td contenteditable="true">${condition.tdMode}</td>
					<td></td> <!-- Placeholder for the first select -->
					<td></td> <!-- Placeholder for the second select -->
					<td contenteditable="true">${condition.sz}</td>
					<td></td> <!-- Placeholder for the third select -->
					<td><button class="delLowRow">Del</button></td>
					<td><button class="actLow">Act</button></td>
				`;

				// Đặt giá trị cho các select từ dữ liệu đã lưu
				row.querySelector("td:nth-child(5)").innerHTML = `<select><option value="buy" ${condition.side === 'buy' ? 'selected' : ''}>buy</option><option value="sell" ${condition.side === 'sell' ? 'selected' : ''}>sell</option></select>`;
				row.querySelector("td:nth-child(6)").innerHTML = `<select><option value="market" ${condition.ordType === 'market' ? 'selected' : ''}>market</option><option value="limit" ${condition.ordType === 'limit' ? 'selected' : ''}>limit</option></select>`;
				row.querySelector("td:nth-child(8)").innerHTML = `<select><option value="base_ccy" ${condition.tgtCcy === 'base_ccy' ? 'selected' : ''}>base_ccy</option><option value="quote_ccy" ${condition.tgtCcy === 'quote_ccy' ? 'selected' : ''}>quote_ccy</option></select>`;

				lowTableBody.appendChild(row);
			});
		};
		reader.readAsText(file);
	}


    // Evaluate conditions and execute actions
    async function checkConditions() {
        const orderTableBody = document.getElementById("orderTableBody");
        const orderRows = Array.from(orderTableBody.rows);
        orderRows.forEach(row => {
            const order = parseInt(row.cells[0].textContent);
            const logic = row.cells[1].textContent;
            const targetPrice = parseFloat(row.cells[2].textContent);
            if (order > 0 && evaluateCondition(logic, targetPrice)) {
				//showAlert('lệnh đúng order');
				//console.log("giá varTokenPrice: ",varTokenPrice); // Kiểm tra xem giá trị đã được thay đổi chưa
				//thongBaoTaget();
				
                executeOrder({
                    apiKey: apiKeyInput.value,
                    secretKey: secretKeyInput.value,
                    passphrase: passphraseInput.value,
                    tdMode: row.cells[3].textContent,
                    side: row.cells[4].querySelector('select').value,
                    ordType: row.cells[5].querySelector('select').value,
                    sz: row.cells[6].textContent,
                    tgtCcy: row.cells[7].querySelector('select').value
                });
				
                updateOrderStatus(row,orderTableBody);
            }
        });

        const lowTableBody = document.querySelector("#LowTable tbody");
        const lowRows = Array.from(lowTableBody.rows);
		
        for (const row of lowRows) {
            const order = parseInt(row.cells[0].textContent);
            const logic = row.cells[1].textContent;
            const targetPrice = parseFloat(row.cells[2].textContent);
			if (order > 0 && evaluateCondition(logic, targetPrice)) {
				//thongBaoTaget();
				if (row.cells[4].querySelector('select').value === 'sell') {
					try {
						const balance = await getTokenBalance();
						if (balance > 0) {
							console.log(balance);
							
							executeOrder({
								apiKey: apiKeyInput.value,
								secretKey: secretKeyInput.value,
								passphrase: passphraseInput.value,
								tdMode: row.cells[3].textContent,
								side: row.cells[4].querySelector('select').value,
								ordType: row.cells[5].querySelector('select').value,
								sz: balance,
								tgtCcy: row.cells[7].querySelector('select').value
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
						tdMode: row.cells[3].textContent,
						side: row.cells[4].querySelector('select').value,
						ordType: row.cells[5].querySelector('select').value,
						sz: row.cells[6].textContent,
						tgtCcy: row.cells[7].querySelector('select').value
					});
					
				}

                updateOrderStatus(row,lowTableBody);
            }
            if (varTokenPrice < targetPrice) {
                updateTargetPrice(row);
            }
        };
    }
	function updateOrderStatus(row,TableBody) {
        const order = parseInt(row.cells[0].textContent);
        
        const opposingOrders = Array.from(TableBody.rows).filter(r => {
            return parseInt(r.cells[0].textContent) === -order;
        });
        opposingOrders.forEach(r => {
            r.cells[0].textContent = Math.abs(parseInt(r.cells[0].textContent));
        });
		
		row.cells[0].textContent = -order;
		console.log("Updated order:", row.cells[0].textContent); // Kiểm tra xem giá trị đã được thay đổi chưa
    }

    function updateTargetPrice(row) {
        row.cells[2].textContent = varTokenPrice;
        showAlert("Updating target price:"+ row);
    }

    function evaluateCondition(logic, targetPrice) {
        switch (logic) {
            case ">":
                return varTokenPrice > targetPrice;
            case "<":
                return varTokenPrice < targetPrice;
            case "=":
                return varTokenPrice === targetPrice;
            default:
                return false;
        }
    }

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
			// Gửi request đến API của OKX
			const response = await fetch(apiUrl + path, {
				method: method,
				headers: headers,
				body: body
			});

			// Xử lý kết quả
			const result = await response.json();

			if (response.ok) {
				showAlert('Order executed successfully:'+ result);
				console.log('Order executed successfully: ', result);
				thongBaoTaget();
			} else {
				showAlert('Error executing order:'+ result);
				console.error('Error: ', result);
			}
		} catch (error) {
			// Xử lý lỗi mạng hoặc lỗi không mong muốn
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

    setInterval(updateTokenPrice, 300);
	// thông báo
	function showAlert(message) {
            const alertBox = document.createElement('div');
            alertBox.className = 'custom-alert';
            alertBox.textContent = message;
            document.body.appendChild(alertBox);

            // Hiển thị alert
            alertBox.style.display = 'block';

            // Tự động ẩn sau 1 giây
            setTimeout(() => {
                alertBox.style.display = 'none';
                alertBox.remove(); // Xóa phần tử khỏi DOM
            }, 1000);
        }
		function thongBaoTaget() {
			// Tạo âm thanh còi báo bằng Web Audio API
			const context = new (window.AudioContext || window.webkitAudioContext)();

			// Tạo nguồn âm thanh
			const oscillator = context.createOscillator();
			const gainNode = context.createGain();

			// Kết nối các node
			oscillator.connect(gainNode);
			gainNode.connect(context.destination);

			// Kiểu sóng tạo âm thanh (square hoặc sine để tạo hiệu ứng thú vị hơn)
			oscillator.type = 'sine';

			// Tần số cao và thấp cho tiếng còi
			const lowFrequency = 600;
			const highFrequency = 1200;

			// Thời gian bắt đầu
			const startTime = context.currentTime;

			// Chu kỳ thay đổi tần số (giống tiếng còi xe cảnh sát)
			const cycleDuration = 0.4; // 0.4 giây mỗi chu kỳ (thay đổi giữa tần số cao và thấp)

			// Thời gian phát âm thanh tổng cộng
			const playDuration = 3; // 5 giây

			// Tạo hiệu ứng còi xe cảnh sát bằng cách lặp qua các chu kỳ
			for (let i = 0; i < playDuration / cycleDuration; i++) {
				const currentCycleStart = startTime + i * cycleDuration;

				// Tần số thấp trong nửa chu kỳ đầu
				oscillator.frequency.setValueAtTime(lowFrequency, currentCycleStart);

				// Tăng lên tần số cao trong nửa chu kỳ tiếp theo
				oscillator.frequency.setValueAtTime(highFrequency, currentCycleStart + cycleDuration / 2);
			}

			// Tắt âm thanh sau khi hết thời gian phát
			oscillator.start(startTime);
			oscillator.stop(startTime + playDuration);

			// Giảm âm lượng dần khi kết thúc
			gainNode.gain.setValueAtTime(1, startTime);
			gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + playDuration);
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
                    tdMode: row.cells[3].textContent,
                    side: row.cells[4].querySelector('select').value,
                    ordType: row.cells[5].querySelector('select').value,
                    sz: row.cells[6].textContent,
                    tgtCcy: row.cells[7].querySelector('select').value
            });
        } else if (event.target.classList.contains("delLowRow")) {
            event.target.closest("tr").remove();
        } else if (event.target.classList.contains("actLow")) {
            const row = event.target.closest("tr");
            executeOrder({
					apiKey: apiKeyInput.value,
                    secretKey: secretKeyInput.value,
                    passphrase: passphraseInput.value,
                    tdMode: row.cells[3].textContent,
                    side: row.cells[4].querySelector('select').value,
                    ordType: row.cells[5].querySelector('select').value,
                    sz: row.cells[6].textContent,
                    tgtCcy: row.cells[7].querySelector('select').value
            });
        }
    });
});
