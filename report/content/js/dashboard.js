/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.85, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.25, 500, 1500, "TC100_R01_Launch"], "isController": false}, {"data": [1.0, 500, 1500, "TC200_R01_Login-1"], "isController": false}, {"data": [1.0, 500, 1500, "TC200_R01_Login-0"], "isController": false}, {"data": [1.0, 500, 1500, "TC400_ClickToCheckOut"], "isController": true}, {"data": [1.0, 500, 1500, "TC400_R01_ClickToCheckOut"], "isController": false}, {"data": [1.0, 500, 1500, "TC200_R01_Login"], "isController": false}, {"data": [1.0, 500, 1500, "TC300_ClickToAutomationKey"], "isController": true}, {"data": [0.25, 500, 1500, "TC100_Launch"], "isController": true}, {"data": [1.0, 500, 1500, "TC200_Login"], "isController": true}, {"data": [1.0, 500, 1500, "TC300_R01_ClickToAutomationKey"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 72, 0, 0.0, 423.9166666666668, 175, 3253, 188.0, 640.0, 1824.0, 3253.0, 3.2190548575863956E-5, 6.049350160431725E-5, 3.180807623764161E-5], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["TC100_R01_Launch", 12, 0, 0.0, 1436.5, 570, 3253, 1200.5, 3253.0, 3253.0, 3253.0, 5.365093168357004E-6, 8.39867612194949E-6, 3.740895041217677E-6], "isController": false}, {"data": ["TC200_R01_Login-1", 12, 0, 0.0, 181.83333333333331, 175, 189, 181.5, 189.0, 189.0, 189.0, 5.365100647468484E-6, 1.3313203852751382E-5, 4.663026929928662E-6], "isController": false}, {"data": ["TC200_R01_Login-0", 12, 0, 0.0, 187.5, 179, 198, 187.0, 198.0, 198.0, 198.0, 5.365100599494642E-6, 1.2469667408981687E-6, 5.06121794835139E-6], "isController": false}, {"data": ["TC400_ClickToCheckOut", 12, 0, 0.0, 180.66666666666669, 177, 183, 181.0, 183.0, 183.0, 183.0, 5.365100705037093E-6, 1.6593040950051247E-5, 4.338186898213588E-6], "isController": true}, {"data": ["TC400_R01_ClickToCheckOut", 12, 0, 0.0, 180.66666666666669, 177, 183, 181.0, 183.0, 183.0, 183.0, 5.365100705037093E-6, 1.6593040950051247E-5, 4.338186898213588E-6], "isController": false}, {"data": ["TC200_R01_Login", 12, 0, 0.0, 370.5, 358, 386, 370.0, 386.0, 386.0, 386.0, 5.365100177324877E-6, 1.4560169328892414E-5, 9.724244071401338E-6], "isController": false}, {"data": ["TC300_ClickToAutomationKey", 12, 0, 0.0, 186.5, 177, 206, 181.5, 206.0, 206.0, 206.0, 5.365100671455404E-6, 6.381535759602229E-6, 4.280553953690493E-6], "isController": true}, {"data": ["TC100_Launch", 12, 0, 0.0, 1436.5, 570, 3253, 1200.5, 3253.0, 3253.0, 3253.0, 5.3650925710844085E-6, 8.398675186961239E-6, 3.7408946247600274E-6], "isController": true}, {"data": ["TC200_Login", 12, 0, 0.0, 370.5, 358, 386, 370.0, 386.0, 386.0, 386.0, 5.365100174926185E-6, 1.4560169322382685E-5, 9.724244067053711E-6], "isController": true}, {"data": ["TC300_R01_ClickToAutomationKey", 12, 0, 0.0, 186.5, 177, 206, 181.5, 206.0, 206.0, 206.0, 5.365100676252788E-6, 6.381535765308493E-6, 4.2805539575180935E-6], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 72, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
