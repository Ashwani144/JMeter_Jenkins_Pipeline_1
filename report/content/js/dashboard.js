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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 48, 0, 0.0, 449.3333333333333, 178, 3253, 192.5, 758.4000000000017, 2609.949999999996, 3253.0, 0.1489781033225221, 0.27996438492217446, 0.14720801843604028], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["TC100_R01_Launch", 8, 0, 0.0, 1571.75, 570, 3253, 1232.0, 3253.0, 3253.0, 3253.0, 0.024886920056991047, 0.038958723487652974, 0.017352793867862898], "isController": false}, {"data": ["TC200_R01_Login-1", 8, 0, 0.0, 184.75, 178, 189, 186.0, 189.0, 189.0, 189.0, 0.02512965330502059, 0.06235786039849348, 0.021841202579558912], "isController": false}, {"data": ["TC200_R01_Login-0", 8, 0, 0.0, 191.0, 180, 198, 193.0, 198.0, 198.0, 198.0, 0.02512823251153543, 0.005840350915767023, 0.02370495371693674], "isController": false}, {"data": ["TC400_ClickToCheckOut", 8, 0, 0.0, 181.25, 179, 183, 181.5, 183.0, 183.0, 183.0, 0.02513131110050011, 0.07772545142117565, 0.020321021085170015], "isController": true}, {"data": ["TC400_R01_ClickToCheckOut", 8, 0, 0.0, 181.25, 179, 183, 181.5, 183.0, 183.0, 183.0, 0.02513131110050011, 0.07772545142117565, 0.020321021085170015], "isController": false}, {"data": ["TC200_R01_Login", 8, 0, 0.0, 376.75, 370, 386, 375.5, 386.0, 386.0, 386.0, 0.025114191087601438, 0.06815657913324648, 0.0455194713462776], "isController": false}, {"data": ["TC300_ClickToAutomationKey", 8, 0, 0.0, 190.5, 181, 206, 187.5, 206.0, 206.0, 206.0, 0.025130205879211668, 0.02989120191492169, 0.020050174026675714], "isController": true}, {"data": ["TC100_Launch", 8, 0, 0.0, 1571.75, 570, 3253, 1232.0, 3253.0, 3253.0, 3253.0, 0.02486750283644954, 0.038928327194168576, 0.017339254907446262], "isController": true}, {"data": ["TC200_Login", 8, 0, 0.0, 376.75, 370, 386, 375.5, 386.0, 386.0, 386.0, 0.025114112247524693, 0.06815636517174914, 0.0455193284486385], "isController": true}, {"data": ["TC300_R01_ClickToAutomationKey", 8, 0, 0.0, 190.5, 181, 206, 187.5, 206.0, 206.0, 206.0, 0.0251301269385537, 0.029891108018709377, 0.02005011104374841], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 48, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
