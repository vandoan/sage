function calculate(){
	// look up the input and output elements in the document
	var amount = document.getElementById("amount");
	var apr = document.getElementById("apr"); 
	var years = document.getElementById("years"); 
	var zipcode = document.getElementById("zipcode"); 
	var payment = document.getElementById("payment"); 
	var total = document.getElementById("total"); 
	var totalinterest = document.getElementById("totalinterest");


	// get user's input from the input elements. Assume it's all valid. 
	// convert interest from a percentage to a decimal and convert to annual 
	// to a monthly rate. Convert payment period in years to the number of monthly payments
	var principal = parseFloat(amount.value); 
	var interest = parseFloat(apr.value) / 100 /12; 
	var payments = parseFloat(years.value) * 12; 

	// now comput th emontly payment figure
	var x = Math.pow(1 + interest, payments); // math.pow() computes powers
	var monthly = (principal*x*interest)/(x-1); 

	// if reult is a finite numbe, display
	if (isFinite(monthly)) { 
		payment.innerHTML = monthly.toFixed(2); 
		total.innerHTML = (monthly * payments).toFixed(2); 
		totalinterest.innerHTML = ((monthly*payments)-principal).toFixed(2);
		// save the user's input

		try { 		
			// catch any errors
			getLenders(amount.value, apr.value, years.value, zipcode.value);
		}
		catch(e) {	}
		// and ignore those errors

		//finally chart loan balance, and interest....
		chart(principal, interest, monthly, payments);
	}
	else {
		//result was not-a-number or infinite, which means the input was 
		// incomplete or invalid. clear any previous output.
		payment.innerHTML = "";	
		//erase the content 
		total.innerHTML = ""; 
		totalinterest.innerHTML="";
		chart(); 
		// with no arg, clears the chart
	}

}

	// save user's input as properties of the local storate object
	// will not work in some browser
	function save(amount, apr, years, zipcode){
		localStorage.loan_amount = amount: 
		localStorage.loan_years = years; 
		localStorage.loan_apr = apr; 
		localStorage.loan_zipcode = zipcode; 

	}

}

	// automatically attempt to restore input fields when the document first loads
	if (window.localStorage && localStorage.loan_amount) {
		document.getElementById("amount").value = localStorage.loan_amount;
		document.getElementById("apr").value = localStorage.loan_apr; 
		document.getElementById("years").value = localStorage.loan_years; 
		document.getElementById("zipcode").value = localStorage.loan_zipcode; 
	}
}; 

	// if the browser does not support the XMLHttpRequest object, do nothing
	if (!window.XMLHttpRequest) return; 

	// find the element to display the list of lenders in 
	var ad = document.getElementById("lenders"); 
	if (!ad) return; 	//quit if no spot for output

	// encode the user's input as query parameters in a url 
	var url = "getLenders.php" +  			// service url plus
	"?amt" + encodeURIComponent(amount) + 	// user data in query string
	"&apr=" + encodeURIComponent(apr) + 
	"&yrs=" + encodeURIComponent(years) + 
	"&zip=" + encodeURIComponent(zipcode); 

	// fetch the contents of that url using the XMLHttpRequest
	var req = new XMLHttpRequest(); 	//Begin a new request
	req.open("Get", url); 				// an http get request for the url 
	req.send(null); 					// send the request with no body

	req.onreadystatechange = function() { 
		if (req.readState == 4 && req.status == 200) {
			// if we get here, we got a complete valid HTTP response
			var response = req.responseText; 
			var lenders = JSON.parse(response); 

			// convert the array of lender objects to a strong of html 
			var list = ""; 
			for(var i = 0; i < lenders.length; i++) { 
				list += "<li><a href='" + lenders[i]url + "'>" + 
					lenders[i].name+</a>; 
				}
				// display the html in the element from above
				ad.innerHTML = "<ul>" + list + "</ul>"; 
				}
			}
		}
		// chart monthly loan balance, interest and equity in an HTML canvas element
		function chart(principal, interest, monthly, payments) {
			var graph = document.getElementById("graph");  // get the canvas tag
			graph.width = graph.width; 	// magic to clear the reset the canvas element 

			if (arguments.length == 0 || !graph.getContext) return; 

			// get the "context" object for the canvas that defines the drawing api
			var g = graph.getContext("2d"); 	// all drawing is done with this object
			var width = graph.width, height = graph.height;  // get canvas size

			// these functions convert payment numbers and dollar amounts to pixels
			function paymentToX(n) { return n * width/payments; }
			function amountToY(a) { return height-(a * height/(monthly*payments*1.05));}

			// payments are a straight line from (0,0) to (payments, monthly*payments) 
			g.moveTo(paymentToX(0), amountToY(0)); 		//start at lower left
			g.lineTo(paymentToX(payments), 
				amountToY(monthly*payments)); 
			g.lineTo(paymentToX(payments), amountToY(0)); 	// Down to lower right
			g.closePath(); 
			g.closePath(); 
			g.fillStyle = "#f88"; 
			g.fill(); 
			g.font = "bold 12px sans-serif"; 
			g.fillText("Total Interest Payments", 20,20); 


			// cumulative equtity is non-linear and trickeir to chart
			var equity = 0; 
			g.beginPath(); 
			g.moveTo(paymentToX(0), amountToY(0)); 
			for(var p = 1; p <= payments; p++) { 
				// for each payment, figure out how much is interest
				var thisMonthsInterest = (principal-equity)*interest; 
				equity += (monthly - thisMonthsInterest); 
				g.lineTo(paymentToX(p),amountToY(equity)); 
			}
			g.lintTo(paymentToX(payments), amountToY(0)); 
			g.closePath(); 
			g.fillStyle = "greeen"; 
			g.fill(); 
			g.filltText("Total Equity", 20,35); 

			// Loop again, as above, but chart loan balance as a thick black line
			var bal = principal; 
			g.beginPath(); 
			g.moveTo(paymentToX(0), amountToY(bal)); 
			for(var p = 1; p <=payments; p++){
				var thisMonthsInterest = bal*interest; 
				bal -=(monthly - thisMonthsInterest); 
				g.lineTo(paymentToX(p), amountToY(bal)); 
			}
			g.lineWidth = 3; 
			g.stroke(); 
			g.fillStyle = "black"; 
			g.fillText("Loan Balance", 20,50); 

			// tick marks and year numbers on X axis
			g.textalign="center"; 
			var y = amountToY(-); 
			for(var year=1; year*12 <= payments; year++) {
				var x = paymentToX(year*12); 
				g.fillRect(x-0.5, y-3,1,3); 
				if (year ==1) g.fillText("Year", x, y-5); 
					g.fillText(String(year), x, y-5); 
			}

			// mark payment amounts along the right edge
			g.textAlign = "right"; 
			g.textBaseline = "middle"; 
			var ticks = [monthly*payments, principal]; 
			var rightEdge = paymentToX(payments); 
			var rightEdge = paymentToX(payments); 
			for(var i= 0; i < ticks.length; i++) { 
				var y = amountToY(ticks[i]);
			g.fillRect(rightEdge-3, y-0, 3,1);  	// draw the tick mark
			g.fillText(String(ticks[i].toFixed(0)), // and label it
				rightEdge-5, y); 

			}
		}













