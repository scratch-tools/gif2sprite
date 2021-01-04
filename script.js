const fileInput = document.getElementById('input');
const image = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const status = document.getElementById('status');
const imgs = document.getElementById('image-container');
const progressContainer = document.getElementsByClassName('progress')[0];
const progress = document.getElementById('progress-bar');

status.textContent = "Waiting for file...";

function hideProgressBar() {
  progressContainer.style.opacity = 0;
}
function showProgressBar() {
  progressContainer.style.opacity = 1;
}
function progressBarDisplay(percentStr) {
  progress.style.width = percentStr;
}


function download(content, name) {
  let el = document.createElement("a");
  el.setAttribute("href", "data:application," + content);
  el.setAttribute("download", name);
  if (document.createEvent) {
    let event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    el.dispatchEvent(event);
  } else {
    el.click();
  }
}



function scan(fileName) {
  showProgressBar();
  progressBarDisplay("0%");
  const createPercentFromDec = dec => Math.round(dec * 1000) / 10;
  const formatPercent = percent => " ".repeat(' 100.0%'.length - (percent + '%').length) + percent + "%";
  status.textContent = "Scanning gif and creating sprite... " + formatPercent(createPercentFromDec(0));
  let size = 100;
  let aspectRatio = image.naturalWidth / image.naturalHeigth;
  if (aspectRatio > 240 / 180) {
    size = 480 / image.naturalWidth * 100;
  } else {
    size = 360 / image.naturalHeight * 100;
  }
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  let jsonData = {isStage:false,name:fileName,variables:{},lists:{},broadcasts:{},blocks:{"PUFYDk[:E8l-9{d[c6#F":{"opcode":"event_whenflagclicked","next":"{^/9-$Y0rV06ev=dgSY+","parent":null,"inputs":{},"fields":{},"shadow":false,"topLevel":true,"x":121,"y":174},"{^/9-$Y0rV06ev=dgSY+":{"opcode":"looks_switchcostumeto","next":"^KC5Nk3z1O#Nw0Z+u)y]","parent":"PUFYDk[:E8l-9{d[c6#F","inputs":{"COSTUME":[1,"ASOfY9`hjFhbD}BHu-hR"]},"fields":{},"shadow":false,"topLevel":false},"ASOfY9`hjFhbD}BHu-hR":{"opcode":"looks_costume","next":null,"parent":"{^/9-$Y0rV06ev=dgSY+","inputs":{},"fields":{"COSTUME":["frame-0",null]},"shadow":true,"topLevel":false},"^KC5Nk3z1O#Nw0Z+u)y]":{"opcode":"control_forever","next":null,"parent":"{^/9-$Y0rV06ev=dgSY+","inputs":{"SUBSTACK":[2,":C|UC-2rq+[.)r_]UF8V"]},"fields":{},"shadow":false,"topLevel":false},":C|UC-2rq+[.)r_]UF8V":{"opcode":"looks_nextcostume","next":"Fo7k`RtiUeH$P%Hk#-Or","parent":"^KC5Nk3z1O#Nw0Z+u)y]","inputs":{},"fields":{},"shadow":false,"topLevel":false},"Fo7k`RtiUeH$P%Hk#-Or":{"opcode":"control_wait","next":null,"parent":":C|UC-2rq+[.)r_]UF8V","inputs":{"DURATION":[1,[5,"<FRAME_DURATION>"]]},"fields":{},"shadow":false,"topLevel":false}},comments:{},currentCostume:0,costumes:[],sounds:[],volume:100,visible:true,x:0,y:0,size:size*2,direction:90,draggable:false,rotationStyle:"all around"}

  const ctx = canvas.getContext('2d');
  gifFrames({url: image.src, frames: 'all', outputType: 'canvas'}, (err, frameData) => {
    if (err) {
      throw err;
    }
    let zip = new JSZip();
    let length = frameData.length;
    let i = 0;
    let delay = 0;
    function next() {
      let frame = frameData[i];
      console.log(frame.frameInfo.delay);
      delay = frame.frameInfo.delay;
      let tempCanvas = frame.getImage();
      let url = tempCanvas.toDataURL('image/png');
      //console.log(frame, tempCanvas.toDataURL('image/png'));
      
      i++;
      let img = new Image();
      img.src = url;
      imgs.appendChild(img);
      img.onload = () => {
      ctx.drawImage(img, 0, 0);
      imgs.innerHTML = '';
      url = canvas.toDataURL('image/png');
      fetch(url).then(n=>n.arrayBuffer()).then(n=>{
        var spark = new SparkMD5.ArrayBuffer()
        spark.append(n);
        let md5 = spark.end();
        let thisCostume = {assetId:md5,name:"frame-" + frame.frameIndex,"bitmapResolution":2,md5ext:md5+".png",dataFormat:"png",rotationCenterX:img.naturalWidth / 2,rotationCenterY:img.naturalHeight / 2};
        jsonData.costumes.push(thisCostume);
        zip.file(md5+".png", url.replace('data:image/png;base64,', ''), {base64: true});
        progressBarDisplay(i / length * 100 + "%");
        status.textContent = "Scanning gif and creating sprite... " + formatPercent(createPercentFromDec(i / length));
        if(i >= length) {
          console.log(i, length);
          zip.file("sprite.json", JSON.stringify(jsonData).replace("<FRAME_DURATION>", '' + (delay / 100)));
          zip.generateAsync({type:"blob"}).then(function(content) {
          // see FileSaver.js
          
            status.textContent = "Downloading file... Upload another if you wish!";
            saveAs(content, fileName + ".sprite3");
            hideProgressBar();
          });
        } else {
          next();
        }
      });
      }
    }
    next();    
  });
}

hideProgressBar();

fileInput.addEventListener('change', () => {
  hideProgressBar();
  status.textContent = "Uploading file...";
  const file = fileInput.files[0];
  //console.log(file);
  const reader = new FileReader();
  reader.onload = (e) => {
    status.textContent = "Waiting for scan to begin...";
    image.src = e.target.result;
    setTimeout(() => {scan(file.name.split('.').join('_'))}, 1000);
  }
  reader.readAsDataURL(file);
}, false);
