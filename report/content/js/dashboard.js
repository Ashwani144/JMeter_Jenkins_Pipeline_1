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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 96, 0, 0.0, 420.9375, 166, 3253, 186.0, 640.0, 1891.799999999996, 3253.0, 1.9890348824792145E-5, 3.737857544450685E-5, 1.9654021438039242E-5], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["TC100_R01_Launch", 16, 0, 0.0, 1432.8750000000002, 568, 3253, 1200.5, 3253.0, 3253.0, 3253.0, 3.3150586230688407E-6, 5.189491184354836E-6, 2.311476422725735E-6], "isController": false}, {"data": ["TC200_R01_Login-1", 16, 0, 0.0, 179.875, 170, 189, 178.0, 189.0, 189.0, 189.0, 3.315060779781927E-6, 8.226142032642458E-6, 2.8812539980526516E-6], "isController": false}, {"data": ["TC200_R01_Login-0", 16, 0, 0.0, 183.375, 166, 198, 181.0, 198.0, 198.0, 198.0, 3.315060761923782E-6, 7.704926380252541E-7, 3.127293648455443E-6], "isController": false}, {"data": ["TC400_ClickToCheckOut", 16, 0, 0.0, 181.75, 174, 196, 181.0, 196.0, 196.0, 196.0, 3.3150607928321102E-6, 1.0252731963768843E-5, 2.6805374379540896E-6], "isController": true}, {"data": ["TC400_R01_ClickToCheckOut", 16, 0, 0.0, 181.75, 174, 196, 181.0, 196.0, 196.0, 196.0, 3.3150607935189625E-6, 1.0252731965893117E-5, 2.680537438509473E-6], "isController": false}, {"data": ["TC200_R01_Login", 16, 0, 0.0, 364.75, 336, 386, 364.5, 386.0, 386.0, 386.0, 3.3150606451589903E-6, 8.996634309469563E-6, 6.0085474193506694E-6], "isController": false}, {"data": ["TC300_ClickToAutomationKey", 16, 0, 0.0, 183.0, 168, 206, 180.5, 206.0, 206.0, 206.0, 3.3150607928321102E-6, 3.943109419599132E-6, 2.6449264333435883E-6], "isController": true}, {"data": ["TC100_Launch", 16, 0, 0.0, 1432.8750000000002, 568, 3253, 1200.5, 3253.0, 3253.0, 3253.0, 3.315058454103539E-6, 5.1894909198515364E-6, 2.311476304912038E-6], "isController": true}, {"data": ["TC200_Login", 16, 0, 0.0, 364.75, 336, 386, 364.5, 386.0, 386.0, 386.0, 3.315060644472138E-6, 8.99663430760554E-6, 6.008547418105751E-6], "isController": true}, {"data": ["TC300_R01_ClickToAutomationKey", 16, 0, 0.0, 183.0, 168, 206, 180.5, 206.0, 206.0, 206.0, 3.3150607942058143E-6, 3.943109421233087E-6, 2.6449264344395998E-6], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 96, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
