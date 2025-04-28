import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";

/**
 * Utility functions for chart operations like downloading
 */

/**
 * Shows a simple loading indicator while downloading charts
 */
const showLoadingIndicator = () => {
  const loader = document.createElement('div');
  loader.id = 'chart-download-loader';
  loader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;
  
  const message = document.createElement('div');
  message.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
  `;
  message.textContent = 'Generating PDF report';
  
  loader.appendChild(message);
  document.body.appendChild(loader);
  
  return loader;
};

/**
 * Removes the loading indicator
 */
const hideLoadingIndicator = () => {
  const loader = document.getElementById('chart-download-loader');
  if (loader) {
    loader.remove();
  }
};

/**
 * Captures a canvas element and downloads it as PNG
 * @param {HTMLCanvasElement} canvas - The canvas element to download
 * @param {string} filename - The filename to save as
 */
export const downloadChart = (canvas, filename = 'chart.png') => {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  } catch (error) {
    console.error('Error downloading chart:', error);
  }
};

/**
 * Gets all chart elements (canvas) in the application
 */
const getAllChartCanvases = () => {
  // Define all possible chart container selectors based on the application structure
  const chartSelectors = [
    // Dashboard overview charts
    '.overview-chart canvas',
    '.overview-charts-container canvas',
    
    // Chart components
    '.largest-classes-chart canvas',
    '.complex-functions-chart canvas', 
    '.quality-metrics-chart canvas',
    '.chart-container canvas',
    
    // Tab-specific charts (ensure we only get canvases)
    '.chart-display canvas',
    
    // Other specific charts
    'canvas.chartjs-render-monitor'
  ];
  
  // Use Set to avoid duplicates if selectors overlap
  const canvasSet = new Set();
  document.querySelectorAll(chartSelectors.join(', ')).forEach(canvas => {
    if (canvas instanceof HTMLCanvasElement) {
        canvasSet.add(canvas);
    }
  });
  return Array.from(canvasSet);
};

/**
 * Maps component name to a readable name for the download filename
 */
const getComponentName = (type) => {
  const nameMap = {
    'LineofCode': 'Line of Code',
    'LOCofMethosChart': 'Lack of Cohesion',
    'CBOChart': 'Coupling Between Objects',
    'HighRiskClassesChart': 'High Risk Classes',
    'TrendHistoryChart': 'Trend History',
    'MetricSummary': 'Metric Summary',
    'LargestClassesChart': 'Largest Classes (by Lines of Code)',
    'MostComplexFunctionsChart': 'Most Complex Functions (by Cyclomatic Complexity)',
    'QualityMetrics': 'Quality Metrics'
  };
  return nameMap[type] || type;
};

/**
 * Identifies and returns all chart elements that should be captured in the report
 * @returns {Array} Array of objects with element and captureType properties
 */
const getInitialCaptureTargets = () => {
  const targets = [];
  
  // Capture overview charts
  document.querySelectorAll('.overview-chart').forEach(chart => {
    if (chart && chart.offsetWidth > 0 && chart.offsetHeight > 0) {
      targets.push({
        element: chart,
        captureType: 'container'
      });
    }
  });
  
  // Capture largest classes and complex functions charts
  document.querySelectorAll('.largest-classes-chart, .complex-functions-chart').forEach(chart => {
    if (chart && chart.offsetWidth > 0 && chart.offsetHeight > 0) {
      targets.push({
        element: chart,
        captureType: 'container'
      });
    }
  });
  
  // Capture quality metrics
  const qualityMetrics = document.querySelector('.quality-metrics-chart');
  if (qualityMetrics && qualityMetrics.offsetWidth > 0 && qualityMetrics.offsetHeight > 0) {
    targets.push({
      element: qualityMetrics,
      captureType: 'container'
    });
  }
  
  // Capture individual chart canvases
  getAllChartCanvases().forEach(canvas => {
    // Skip canvases that are already captured as part of containers
    const isInContainer = canvas.closest('.overview-chart, .largest-classes-chart, .complex-functions-chart, .quality-metrics-chart');
    if (!isInContainer && canvas.width > 0 && canvas.height > 0) {
      targets.push({
        element: canvas,
        captureType: 'canvas'
      });
    }
  });
  
  return targets;
};

/**
 * Gets a snapshot of all chart tabs by iterating through them.
 * Captures Metric Summary using html2canvas, others using canvas.toDataURL.
 */
const captureAllChartTabs = async (metricData) => {
  if (!metricData || (Array.isArray(metricData) && metricData.length === 0)) {
    console.warn('No metric data available for chart tab capture');
    return [];
  }
  
  const tabOptions = [
    "Metric Summary",
    "Line of Code",
    "Lack of Cohesion of Methods",
    "Coupling Between Objects", 
    "Trend History",
    "High Risk Classes Chart"
  ];
  
  const tabDropdown = document.querySelector('.chart-tab-dropdown select');
  if (!tabDropdown) {
    console.warn('Chart tab dropdown not found in DOM');
    return [];
  }
  
  const originalValue = tabDropdown.value;
  const capturedTabs = [];
  
  try {
    for (const tabOption of tabOptions) {
      document.querySelector('#chart-download-loader div').textContent = 
        `Downloading ${tabOption} tab`;
        
      tabDropdown.value = tabOption;
      const event = new Event('change', { bubbles: true });
      tabDropdown.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      const chartDisplay = document.querySelector('.chart-display');
      if (!chartDisplay) {
        console.warn(`Chart display area not found for tab: ${tabOption}`);
        continue;
      }

      // Capture Metric Summary Table via html2canvas
      if (tabOption === "Metric Summary") {
         try {
            console.log(`Capturing container for ${tabOption}`);
            const containerCanvas = await html2canvas(chartDisplay, { scale: 2 }); 
            const dataUrl = containerCanvas.toDataURL('image/png');
            if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
               capturedTabs.push({ name: tabOption, dataUrl: dataUrl });
               console.log(`Captured ${tabOption} container.`);
            } else { console.warn(`Invalid data URL for ${tabOption} container`); }
         } catch (err) { console.error(`Error capturing ${tabOption} container:`, err); }
         continue;
      }

      // Capture Canvases for other tabs
      const chartCanvases = chartDisplay.querySelectorAll('canvas');
      if (chartCanvases.length > 0) {
        for (let i = 0; i < chartCanvases.length; i++) {
          const canvas = chartCanvases[i];
          try {
            if (canvas.width > 0 && canvas.height > 0) {
              const dataUrl = canvas.toDataURL('image/png');
              if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
                const chartName = chartCanvases.length > 1 ? `${tabOption} - Chart ${i+1}` : tabOption;
                capturedTabs.push({ name: chartName, dataUrl: dataUrl });
                 console.log(`Captured ${chartName}.`);
              } else { console.warn(`Invalid data URL for ${tabOption} canvas ${i+1}`); }
            } else { console.warn(`Canvas ${i+1} for ${tabOption} has zero dimensions.`); }
          } catch (err) { console.error(`Error capturing canvas ${i+1} in ${tabOption}:`, err); }
        }
      } else {
         console.warn(`No canvas found in ${tabOption}. Skipping capture.`);
      }
    }
  } finally {
    tabDropdown.value = originalValue;
    tabDropdown.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 200)); 
  }
  
  return capturedTabs;
};

//PDF report generation
const downloadPDFReport = (chartImages) => {
  if (!chartImages || chartImages.length === 0) {
    alert('No valid charts captured to include in the report.');
    return;
  }

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const usableWidth = pageWidth - 2 * margin;
    let currentY = margin;
    const titleFontSize = 16;
    const subtitleFontSize = 12;
    const textFontSize = 10;
    const imagePadding = 5;
    const titleSpacing = 8;
    const dateSpacing = 5;
    const chartTitleSpacing = 6;
    const chartSpacing = 15;

    const checkAndAddPage = (neededHeight) => {
      if (currentY + neededHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        // Add header to new pages if desired
        // doc.setFontSize(10); 
        // doc.text(`Report Continuation`, margin, currentY); 
        // currentY += 10;
        return true;
      }
      return false;
    };

    let repoName = 'Repository';
    try {
      const repoUrlElement = document.querySelector('.repo-url');
      if (repoUrlElement && repoUrlElement.textContent) {
        const urlText = repoUrlElement.textContent.trim();
        const match = urlText.match(/github\.com\/([^\/]+\/[^\/]+)/i);
        if (match && match[1]) repoName = match[1];
      }
    } catch (e) {
    }
    
    //  Header of report
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(`${repoName} Analysis Report`, pageWidth / 2, currentY, { align: 'center' });
    currentY += titleSpacing;
    doc.setFontSize(subtitleFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += dateSpacing * 2;
    doc.setDrawColor(200);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // Charts in report
    let chartsIncluded = 0;
    chartImages.forEach((image) => {
        if (!image.dataUrl || !image.dataUrl.startsWith('data:image/png;base64,')) {
            //console.warn(`Skipping invalid image data for chart: ${image.name}`);
            return;
        }
        
        try {
            const imgProps = doc.getImageProperties(image.dataUrl);
            const aspectRatio = imgProps.width / imgProps.height;
            let pdfImgWidth = usableWidth; 
            let pdfImgHeight = pdfImgWidth / aspectRatio;

            const maxImgHeight = pageHeight * 0.7; 
            if (pdfImgHeight > maxImgHeight) {
                pdfImgHeight = maxImgHeight;
                pdfImgWidth = pdfImgHeight * aspectRatio;
            }
            if (pdfImgWidth > usableWidth) {
                 pdfImgWidth = usableWidth;
                 pdfImgHeight = pdfImgWidth / aspectRatio;
            }

            const neededHeight = chartTitleSpacing + imagePadding + pdfImgHeight + imagePadding + chartSpacing;
            
            if (checkAndAddPage(neededHeight)) 

            doc.setFontSize(subtitleFontSize);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(image.name, margin, currentY);
            currentY += chartTitleSpacing;

            doc.addImage(image.dataUrl, 'PNG', margin, currentY, pdfImgWidth, pdfImgHeight, undefined, 'NONE'); 
            currentY += pdfImgHeight + chartSpacing;
            chartsIncluded++;

        } catch (imgError) {
            console.error(`Error adding image to PDF for chart ${image.name}:`, imgError);
            checkAndAddPage(20);
            doc.setTextColor(255, 0, 0);
            doc.setFontSize(textFontSize);
            doc.text(`Error loading image for: ${image.name}`, margin, currentY);
            currentY += 10;
        }
    });

    // Footer of report
    doc.setFontSize(textFontSize - 1);
    doc.setTextColor(150);
    const footerText = `End of Report - ${chartsIncluded} charts included`;
    doc.text(footerText, pageWidth / 2, pageHeight - (margin/2), { align: 'center' });

    // Save report
    const safeRepoName = repoName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${safeRepoName}_Analysis.pdf`;
    doc.save(fileName);
    console.log(`PDF generated: ${fileName}`);

  } catch (error) {
    console.error('Error generating PDF with jsPDF:', error);
    alert('Error generating PDF. Check console.');
  }
};

export const downloadAllCharts = async () => {
  const loader = showLoadingIndicator();
  
  try {
    const allCapturedCharts = [];
    const capturedDataUrls = new Set(); 

    // 1. Landing page charts
    document.querySelector('#chart-download-loader div').textContent = 
      'Visible charts on landing page';
      
    const initialTargets = getInitialCaptureTargets(); 
    //console.log(`Found ${initialTargets.length} initial targets to capture.`);

    for (const target of initialTargets) {
      const elementToCapture = target.element;
      let title = 'Unknown Chart'; // Default title

      try {
          const overviewChartWrapper = elementToCapture.closest('.overview-chart'); 
          const containerForTitleSearch = overviewChartWrapper || elementToCapture;

          let titleElement = containerForTitleSearch.querySelector('.overview-chart-title, h3, h4');
          
          if (titleElement && titleElement.textContent) {
              title = titleElement.textContent.trim();
              //console.log(`Found title via heading/class: "${title}"`);
          } else {
              const canvasElement = elementToCapture.querySelector('canvas') || (elementToCapture instanceof HTMLCanvasElement ? elementToCapture : null);
              if (canvasElement && window.Chart && window.Chart.instances) {
                  const chartInstance = Object.values(window.Chart.instances).find(instance => instance.canvas === canvasElement);
                  if (chartInstance && chartInstance.options?.plugins?.title?.text) {
                      title = chartInstance.options.plugins.title.text;
                      //console.log(`Found title via Chart.js instance options: "${title}"`);
                  } else {
                      //console.log('Could not find title via heading or Chart.js options, using fallback.');
                      const componentClass = elementToCapture.className.match(/(largest-classes-chart|complex-functions-chart)/);
                      if (componentClass && componentClass[1]) {
                          title = getComponentName(componentClass[1].replace(/-/g, '').replace(/chart$/, 'Chart'));
                      } else {
                          title = `Overview Section`;
                      }
                  }
              } else {
                 // If no chart found
                 const componentClass = elementToCapture.className.match(/(largest-classes-chart|complex-functions-chart)/);
                 if (componentClass && componentClass[1]) {
                     title = getComponentName(componentClass[1].replace(/-/g, '').replace(/chart$/, 'Chart'));
                 } else {
                     title = `Overview Section`;
                 }
                 //console.log(`Using fallback title after failing other methods: "${title}"`);
              }
          }
      } catch (titleError) {
          //console.error('Error during title extraction:', titleError);
          title = 'Error Extracting Title'; 
      }
       
      //console.log(`Attempting to capture initial element for: ${title}`);
      document.querySelector('#chart-download-loader div').textContent = 
          `Downloading: ${title}`;
      
      try {
         let dataUrl = null;
         // Capture container for specific types needing KPIs/better resolution
         if (target.captureType === 'container' && elementToCapture.offsetWidth > 0 && elementToCapture.offsetHeight > 0) {
            //console.log(`Capturing container with html2canvas (scale 2) for: ${title}`);
            const containerCanvas = await html2canvas(elementToCapture, { scale: 2 });
            dataUrl = containerCanvas.toDataURL('image/png');
         // Capture direct canvas otherwise
         } else if (target.captureType === 'canvas' && elementToCapture.width > 0 && elementToCapture.height > 0) {
            //console.log(`Capturing canvas directly for: ${title}`);
            dataUrl = elementToCapture.toDataURL('image/png');
         } else {
             //console.warn(`Skipping capture for ${title} due to zero dimensions or incorrect type.`);
         }

         if (dataUrl && dataUrl.startsWith('data:image/png;base64,') && !capturedDataUrls.has(dataUrl)) {
            allCapturedCharts.push({ name: title, dataUrl: dataUrl });
            capturedDataUrls.add(dataUrl);
            //console.log(`Successfully captured initial element: ${title}`);
         } else if (dataUrl && capturedDataUrls.has(dataUrl)){
             //console.log(`Skipping duplicate initial element: ${title}`);
         } else if (dataUrl) {
             //console.warn(`Invalid data URL generated for initial element: ${title}`);
         }
      } catch (error) {
        console.error(`Error capturing initial element (${title}):`, error);
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // 2. Get Metric Data
    const metricData = window.appMetricsData || [];
    
    // 3. Getting each tab chart
    document.querySelector('#chart-download-loader div').textContent = 
      'Downloading charts';
      
    const capturedTabs = await captureAllChartTabs(metricData);
    
capturedTabs.forEach(tab => {
        if (tab.dataUrl && tab.dataUrl.startsWith('data:image/png;base64,') && !capturedDataUrls.has(tab.dataUrl)) {
            allCapturedCharts.push(tab);
            capturedDataUrls.add(tab.dataUrl);
        }
    });
    
    // 4. Generating PDF
    if (allCapturedCharts.length > 0) {
      document.querySelector('#chart-download-loader div').textContent = 
        'Generating PDF report';
      
      downloadPDFReport(allCapturedCharts);
    } else {
      alert('No valid charts or content found to include in the report.');
    }
    
  } catch (error) {
    //console.error('Error during PDF report generation process:', error);
    alert('An error occurred while generating the PDF report. Check console.');
  } finally {
    setTimeout(() => {
      hideLoadingIndicator();
    }, 3500); 
  }
};

export default {
  downloadAllCharts
}; 