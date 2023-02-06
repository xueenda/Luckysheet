import { mouseposition } from '../global/location';
import server from './server';
import luckysheetsizeauto from './resize';
import { modelHTML } from './constant';
import {checkProtectionAuthorityNormal} from './protection';
import { getSheetIndex } from '../methods/get';
import { setluckysheet_scroll_status } from '../methods/set';
import { replaceHtml } from '../utils/util';
import Store from '../store';
import locale from '../locale/locale';
import tooltip from '../global/tooltip';
import method from '../global/method';

const buttonCtrl = {
    btnItem: {
        type: '3',  //1移动并调整单元格大小 2移动并且不调整单元格的大小 3不要移动单元格并调整其大小
        onclick: null,  // button function
        originWidth: null,  //图片原始宽度
        originHeight: null,  //图片原始高度
        default: {
            width: null,  //图片 宽度
            height: null,  //图片 高度
            left: null,  //图片离表格左边的 位置
            top: null,  //图片离表格顶部的 位置
        },
        crop: {
            width: null,  //图片裁剪后 宽度
            height: null,  //图片裁剪后 高度
            offsetLeft: 0,  //图片裁剪后离未裁剪时 左边的位移
            offsetTop: 0,  //图片裁剪后离未裁剪时 顶部的位移
        },
        isFixedPos: false,  //固定位置
        fixedLeft: null,  //固定位置 左位移
        fixedTop: null,  //固定位置 右位移
        border: {
            width: 0,  //边框宽度
            radius: 0,  //边框半径
            style: 'solid',  //边框类型
            color: '#000',  //边框颜色
        }
    },
    buttons: null,
    currentBtnId: null,
    currentWinW: null,
    currentWinH: null,
    resize: null,  
    resizeXY: null,
    move: false,
    moveXY: null,
    cropChange: null,  
    cropChangeXY: null,
    cropChangeObj: null,
    copyImgItemObj: null,
    insertBtn: function () {
        buttonCtrl._insertBtn();
    },

    _insertBtn: function(){
        let _this = this;
        
        let last = Store.luckysheet_select_save[Store.luckysheet_select_save.length - 1];
        let rowIndex = last.row_focus || 0;
        let colIndex = last.column_focus || 0;
        let left = colIndex == 0 ? 0 : Store.visibledatacolumn[colIndex - 1];
        let top = rowIndex == 0 ? 0 : Store.visibledatarow[rowIndex - 1];

        
        let btn = {
            onclick: null,
            left: left,
            top: top,
            originWidth: 100,
            originHeight: 40
        }

        _this.addBtnItem(btn);
    },
    generateRandomId: function(prefix) {
        if(prefix == null){
            prefix = "btn";
        }

        let userAgent = window.navigator.userAgent.replace(/[^a-zA-Z0-9]/g, "").split("");

        let mid = "";

        for(let i = 0; i < 12; i++){
            mid += userAgent[Math.round(Math.random() * (userAgent.length - 1))];
        }

        let time = new Date().getTime();

        return prefix + "_" + mid + "_" + time;
    },
    modelHtml: function(id, btnItem) {
        let _this = this;

        let imageUrlHandle = Store.toJsonOptions && Store.toJsonOptions['imageUrlHandle'];
        let onclick = typeof imageUrlHandle === 'function' ? imageUrlHandle(btnItem.onclick) : btnItem.onclick;
        let imgItemParam = _this.getImgItemParam(btnItem);
        onclick = "function hi(){alert('Hi!')};hi()"

        let width = imgItemParam.width * Store.zoomRatio;
        let height = imgItemParam.height * Store.zoomRatio;
        let left = imgItemParam.left * Store.zoomRatio;
        let top = imgItemParam.top * Store.zoomRatio;
        let position = imgItemParam.position;

        let borderWidth = btnItem.border.width;

        // return  `<div id="${id}" class="luckysheet-modal-dialog-button" style="width:${width}px;height:${height}px;padding:0;position:${position};left:${left}px;top:${top}px;z-index:200;">
        //             <button onclick="${onclick}" style="position:absolute;left:${-btnItem.crop.offsetLeft * Store.zoomRatio}px;top:${-btnItem.crop.offsetTop * Store.zoomRatio}px; z-index:200; cursor: pointer;">Run</button>
        //         </div>`;

        return  `<div id="${id}" class="luckysheet-modal-dialog luckysheet-modal-dialog-button" style="width:${width}px;height:${height}px;padding:0;position:${position};left:${left}px;top:${top}px;z-index:200;">
                    <div class="luckysheet-modal-dialog-content" style="width:100%;height:100%;overflow:hidden;position:relative;">
                        <button onclick="${onclick}" style="position:absolute;width:${btnItem.default.width * Store.zoomRatio}px;height:${btnItem.default.height * Store.zoomRatio}px;left:${-btnItem.crop.offsetLeft * Store.zoomRatio}px;top:${-btnItem.crop.offsetTop * Store.zoomRatio}px; z-index:200; cursor: pointer;">Run</button>
                    </div>
                    <div class="luckysheet-modal-dialog-border" style="border:${borderWidth}px ${btnItem.border.style} ${btnItem.border.color};border-radius:${btnItem.border.radius * Store.zoomRatio}px;position:absolute;left:${-borderWidth}px;right:${-borderWidth}px;top:${-borderWidth}px;bottom:${-borderWidth}px;"></div>
                </div>`;
    },
    getSliderHtml: function() {
        let imageText = locale().imageText;

        return `<div id="luckysheet-modal-dialog-slider-buttonCtrl" class="luckysheet-modal-dialog-slider luckysheet-modal-dialog-slider-buttonCtrl" style="display:block;">
                    <div class="luckysheet-modal-dialog-slider-title">
                        <span>${imageText.imageSetting}</span>
                        <span class="luckysheet-model-close-btn" title="${imageText.close}">
                            <i class="fa fa-times" aria-hidden="true"></i>
                        </span>
                    </div>
                    <div class="luckysheet-modal-dialog-slider-content">
                        <div class="slider-box">
                            <div class="slider-box-title">${imageText.conventional}</div>
                            <div class="slider-box-radios">
                                <div class="radio-item">
                                    <input type="radio" id="imgItemType1" name="imgItemType" value="1">
                                    <label for="imgItemType1">${imageText.moveCell1}</label>
                                </div>
                                <div class="radio-item">
                                    <input type="radio" id="imgItemType2" name="imgItemType" value="2">
                                    <label for="imgItemType2">${imageText.moveCell2}</label>
                                </div>
                                <div class="radio-item">
                                    <input type="radio" id="imgItemType3" name="imgItemType" value="3">
                                    <label for="imgItemType3">${imageText.moveCell3}</label>
                                </div>
                            </div>
                            <div class="slider-box-checkbox">
                                <input type="checkbox" id="imgItemIsFixedPos">
                                <label for="imgItemIsFixedPos">${imageText.fixedPos}</label>
                            </div>
                        </div>
                        <div class="slider-box">
                            <div class="slider-box-title">${imageText.border}</div>
                            <div class="slider-box-borderConfig">
                                <div class="border-item">
                                    <label>${imageText.width}</label>
                                    <input type="number" id="imgItemBorderWidth" min="0">
                                </div>
                                <div class="border-item">
                                    <label>${imageText.radius}</label>
                                    <input type="number" id="imgItemBorderRadius" min="0">
                                </div>
                                <div class="border-item">
                                    <label>${imageText.style}</label>
                                    <select id="imgItemBorderStyle">
                                        <option value="solid">${imageText.solid}</option>
                                        <option value="dashed">${imageText.dashed}</option>
                                        <option value="dotted">${imageText.dotted}</option>
                                        <option value="double">${imageText.double}</option>
                                    </select>
                                </div>
                                <div class="border-item">
                                    <label>${imageText.color}</label>
                                    <div id="imgItemBorderColor" class="imgItemBorderColor">
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
    },
    sliderHtmlShow: function() {
        let _this = this;

        $("#luckysheet-modal-dialog-slider-buttonCtrl").remove();

        let sliderHtml = _this.getSliderHtml();
        $("body").append(sliderHtml);
        luckysheetsizeauto();

        let btnItem = _this.buttons[_this.currentBtnId];

        //类型
        let type = btnItem.type;
        $("#luckysheet-modal-dialog-slider-buttonCtrl #imgItemType" + type).prop("checked", true);

        //固定位置
        let isFixedPos = btnItem.isFixedPos;
        $("#luckysheet-modal-dialog-slider-buttonCtrl #imgItemIsFixedPos").prop("checked", isFixedPos);

        //边框宽度
        let border = btnItem.border;
        $("#luckysheet-modal-dialog-slider-buttonCtrl #imgItemBorderWidth").val(border.width);
        $("#luckysheet-modal-dialog-slider-buttonCtrl #imgItemBorderRadius").val(border.radius);
        $("#luckysheet-modal-dialog-slider-buttonCtrl #imgItemBorderStyle").val(border.style);
        $("#luckysheet-modal-dialog-slider-buttonCtrl #imgItemBorderColor span").css("background-color", border.color).attr("title", border.color);
    
        _this.init();
    },
    colorSelectDialog: function(currenColor){
        const _locale = locale();
        const locale_button = _locale.button;
        const locale_toolbar = _locale.toolbar;
        const locale_imageCtrl = _locale.buttonCtrl;

        $("#luckysheet-modal-dialog-mask").show();
        $("#luckysheet-buttonCtrl-colorSelect-dialog").remove();

        $("body").append(replaceHtml(modelHTML, { 
            "id": "luckysheet-buttonCtrl-colorSelect-dialog", 
            "addclass": "luckysheet-buttonCtrl-colorSelect-dialog", 
            "title": locale_imageCtrl.borderTile, 
            "content": `<div class="currenColor">
                            ${locale_imageCtrl.borderCur}:<span title="${currenColor}" style="background-color:${currenColor}"></span>
                        </div>
                        <div class="colorshowbox"></div>`, 
            "botton":  `<button id="luckysheet-buttonCtrl-colorSelect-dialog-confirm" class="btn btn-primary">${locale_button.confirm}</button>
                        <button class="btn btn-default luckysheet-model-close-btn">${locale_button.cancel}</button>`, 
            "style": "z-index:100003" 
        }));
        let $t = $("#luckysheet-buttonCtrl-colorSelect-dialog")
                .find(".luckysheet-modal-dialog-content")
                .css("min-width", 300)
                .end(), 
            myh = $t.outerHeight(), 
            myw = $t.outerWidth();
        let winw = $(window).width(), winh = $(window).height();
        let scrollLeft = $(document).scrollLeft(), scrollTop = $(document).scrollTop();
        $("#luckysheet-buttonCtrl-colorSelect-dialog").css({ 
            "left": (winw + scrollLeft - myw) / 2, 
            "top": (winh + scrollTop - myh) / 3 
        }).show();
        
        //初始化选择颜色插件
        $("#luckysheet-buttonCtrl-colorSelect-dialog").find(".colorshowbox").spectrum({
            showPalette: true,
            showPaletteOnly: true,
            preferredFormat: "hex",
            clickoutFiresChange: false,
            showInitial: true,
            showInput: true,
            flat: true,
            hideAfterPaletteSelect: true,
            showSelectionPalette: true,
            showButtons: false,//隐藏选择取消按钮
            maxPaletteSize: 8,
            maxSelectionSize: 8,
            color: currenColor,
            cancelText: locale_button.cancel,
            chooseText: locale_toolbar.confirmColor,
            togglePaletteMoreText: locale_toolbar.customColor,
            togglePaletteLessText: locale_toolbar.collapse,
            togglePaletteOnly: true,
            clearText: locale_toolbar.clearText,
            noColorSelectedText: locale_toolbar.noColorSelectedText,
            localStorageKey: "spectrum.textcolor" + server.gridKey,
            palette: [
                ["#000", "#444", "#666", "#999", "#ccc", "#eee", "#f3f3f3", "#fff"],
                ["#f00", "#f90", "#ff0", "#0f0", "#0ff", "#00f", "#90f", "#f0f"],
                ["#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc"],
                ["#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
                ["#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6fa8dc", "#8e7cc3", "#c27ba0"],
                ["#c00", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7", "#a64d79"],
                ["#900", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#0b5394", "#351c75", "#741b47"],
                ["#600", "#783f04", "#7f6000", "#274e13", "#0c343d", "#073763", "#20124d", "#4c1130"]
            ],
            move: function(color){
                if (color != null) {
                    color = color.toHexString();
                }
                else {
                    color = "#000";
                }

                $("#luckysheet-buttonCtrl-colorSelect-dialog .currenColor span").css("background-color", color).attr("title", color);
            }
        });
    },
    init: function() {
        let _this = this;

        //关闭
        $("#luckysheet-modal-dialog-slider-buttonCtrl .luckysheet-model-close-btn").click(function () {
            $("#luckysheet-modal-dialog-slider-buttonCtrl").hide();
            luckysheetsizeauto();
        });

        //常规
        $("#luckysheet-modal-dialog-slider-buttonCtrl").off("change.radio").on("change.radio", ".radio-item input[type=radio][name=imgItemType]", function() {
            _this.configChange("type", this.value);
        })

        //固定位置
        $("#luckysheet-modal-dialog-slider-buttonCtrl").off("change.checkbox").on("change.checkbox", ".slider-box-checkbox input[type=checkbox]", function() {
            _this.configChange("fixedPos", this.checked);
        })

        //边框宽度
        $("#luckysheet-modal-dialog-slider-buttonCtrl").off("change.borderWidth").on("change.borderWidth", "#imgItemBorderWidth", function() {
            _this.configChange("border-width", this.valueAsNumber);
        })

        //边框半径
        $("#luckysheet-modal-dialog-slider-buttonCtrl").off("change.borderRadius").on("change.borderRadius", "#imgItemBorderRadius", function() {
            _this.configChange("border-radius", this.valueAsNumber);
        })

        //边框样式
        $("#luckysheet-modal-dialog-slider-buttonCtrl").off("change.borderStyle").on("change.borderStyle", "#imgItemBorderStyle", function() {
            _this.configChange("border-style", this.value);
        })

        //边框颜色 选择
        $("#luckysheet-modal-dialog-slider-buttonCtrl").off("click.color").on("click.color", "#imgItemBorderColor", function() {
            let currenColor = $(this).find("span").attr("title");
            _this.colorSelectDialog(currenColor);
        })

        //边框选择颜色 确定 
        $(document).off("click.selectColorConfirm").on("click.selectColorConfirm", "#luckysheet-buttonCtrl-colorSelect-dialog-confirm", function(){
            let $parent = $(this).parents("#luckysheet-buttonCtrl-colorSelect-dialog");
            $("#luckysheet-modal-dialog-mask").hide();
            $parent.hide();

            let currenColor = $parent.find(".currenColor span").attr("title");
            $("#luckysheet-modal-dialog-slider-buttonCtrl #imgItemBorderColor span").css("background-color", currenColor).attr("title", currenColor);

            _this.configChange("border-color", currenColor);            
        });

        //image active
        $("#luckysheet-button-showBoxs").on("click", ".luckysheet-modal-dialog-button", function(e) {

            if(!checkProtectionAuthorityNormal(Store.currentSheetIndex, "editObjects",false)){
                return;
            }

            $(this).hide();
            let id = $(this).attr("id");

            if(_this.currentBtnId != null && _this.currentBtnId != id){
                _this.cancelActiveImgItem();
            }

            _this.currentBtnId = id;

            let item = _this.buttons[id];
            let imgItemParam = _this.getImgItemParam(item);

            let width = imgItemParam.width * Store.zoomRatio;
            let height = imgItemParam.height * Store.zoomRatio;
            let left = imgItemParam.left * Store.zoomRatio;
            let top = imgItemParam.top * Store.zoomRatio;
            let position = imgItemParam.position;
        
            $("#luckysheet-modal-dialog-activeButton").show().css({
                "width": width,
                "height": height,
                "left": left,
                "top": top,
                "position": position
            });
            // let imageUrlHandle = Store.toJsonOptions && Store.toJsonOptions['imageUrlHandle'];
            // let imgUrl = typeof imageUrlHandle === 'function' ? imageUrlHandle(item.src) : item.src;
            $("#luckysheet-modal-dialog-activeButton .luckysheet-modal-dialog-content").css({
                // "background-image": "url(" + imgUrl + ")",
                "background-size": item.default.width * Store.zoomRatio + "px " + item.default.height * Store.zoomRatio + "px",
                "background-position": -item.crop.offsetLeft * Store.zoomRatio + "px " + -item.crop.offsetTop * Store.zoomRatio + "px"
            })

            $("#luckysheet-modal-dialog-activeButton .luckysheet-modal-dialog-border").css({
                "border-width": item.border.width * Store.zoomRatio,
                "border-style": item.border.style,
                "border-color": item.border.color,
                "border-radius": item.border.radius * Store.zoomRatio,
                "left": -item.border.width * Store.zoomRatio,
                "right": -item.border.width * Store.zoomRatio,
                "top": -item.border.width * Store.zoomRatio,
                "bottom": -item.border.width * Store.zoomRatio,
            })

            _this.sliderHtmlShow();

            e.stopPropagation();
        })

        //image move
        $("#luckysheet-modal-dialog-activeImage").off("mousedown.move").on("mousedown.move", ".luckysheet-modal-dialog-content", function(e) {
            if(!checkProtectionAuthorityNormal(Store.currentSheetIndex, "editObjects",false)){
                return;
            }
            
            if(!$("#luckysheet-modal-dialog-slider-buttonCtrl").is(":visible")){
                _this.sliderHtmlShow();
            }
            
            _this.move = true;
            
            _this.currentWinW = $("#luckysheet-cell-main")[0].scrollWidth;
            _this.currentWinH = $("#luckysheet-cell-main")[0].scrollHeight;

            let offset = $("#luckysheet-modal-dialog-activeImage").offset();

            _this.moveXY = [
                e.pageX - offset.left, 
                e.pageY - offset.top, 
            ];

            setluckysheet_scroll_status(true);

            e.stopPropagation();
        })

        //image resize
        $("#luckysheet-modal-dialog-activeImage").off("mousedown.resize").on("mousedown.resize", ".luckysheet-modal-dialog-resize-item", function(e) {
            if(!checkProtectionAuthorityNormal(Store.currentSheetIndex, "editObjects",false)){
                return;
            }
            
            _this.currentWinW = $("#luckysheet-cell-main")[0].scrollWidth;
            _this.currentWinH = $("#luckysheet-cell-main")[0].scrollHeight;

            _this.resize = $(this).data("type");

            let scrollTop = $("#luckysheet-cell-main").scrollTop(), 
                scrollLeft = $("#luckysheet-cell-main").scrollLeft();
            let mouse = mouseposition(e.pageX, e.pageY);
            let x = mouse[0] + scrollLeft;
            let y = mouse[1] + scrollTop;

            let position = $("#luckysheet-modal-dialog-activeImage").position();
            let width = $("#luckysheet-modal-dialog-activeImage").width();
            let height = $("#luckysheet-modal-dialog-activeImage").height();

            _this.resizeXY = [
                x, 
                y, 
                width, 
                height, 
                position.left + scrollLeft, 
                position.top + scrollTop, 
                scrollLeft, 
                scrollTop
            ];

            setluckysheet_scroll_status(true);
            
            e.stopPropagation();
        })

        //image croppingEnter
        $("#luckysheet-modal-dialog-activeImage").off("mousedown.croppingEnter").on("mousedown.croppingEnter", ".luckysheet-modal-controll-crop", function(e) {
            _this.croppingEnter();
            e.stopPropagation();
        })

        //image croppingExit
        $("#luckysheet-modal-dialog-cropping").off("mousedown.croppingExit").on("mousedown.croppingExit", ".luckysheet-modal-controll-crop", function(e) {
            _this.croppingExit();
            e.stopPropagation();
        })

        //image crop change
        $("#luckysheet-modal-dialog-cropping").off("mousedown.cropChange").on("mousedown.cropChange", ".resize-item", function(e) {
            _this.cropChange = $(this).data("type");

            let scrollTop = $("#luckysheet-cell-main").scrollTop(), 
                scrollLeft = $("#luckysheet-cell-main").scrollLeft();
            let mouse = mouseposition(e.pageX, e.pageY);
            let x = mouse[0] + scrollLeft;
            let y = mouse[1] + scrollTop;

            _this.cropChangeXY = [
                x, 
                y
            ];

            setluckysheet_scroll_status(true);
            
            e.stopPropagation();
        })

        //image restore
        $("#luckysheet-button-showBoxs").off("mousedown.restore").on("mousedown.restore", ".luckysheet-modal-controll-restore", function(e) {
            _this.restoreImgItem();
            e.stopPropagation();
        })

        //image delete
        $("#luckysheet-button-showBoxs").off("mousedown.delete").on("mousedown.delete", ".luckysheet-modal-controll-del", function(e) {
            _this.removeImgItem();
            e.stopPropagation();
        })
    },
    configChange: function(type, value){
        let _this = this;

        let btnItem = _this.buttons[_this.currentBtnId];

        switch(type){
            case "type":
                btnItem.type = value;
                break;
            case "fixedPos":
                btnItem.isFixedPos = value;

                let imgItemParam = _this.getImgItemParam(btnItem);
                let width = imgItemParam.width;
                let height = imgItemParam.height;
                let left = imgItemParam.left;
                let top = imgItemParam.top;
                let position = imgItemParam.position;
            
                $("#luckysheet-modal-dialog-activeImage").show().css({
                    "width": width,
                    "height": height,
                    "left": left,
                    "top": top,
                    "position": position
                });
                break;
            case "border-width":
                btnItem.border.width = value;
                $("#luckysheet-modal-dialog-activeImage .luckysheet-modal-dialog-border").css({
                    "border-width": value,
                    "left": -value,
                    "right": -value,
                    "top": -value,
                    "bottom": -value
                });
                break;
            case "border-radius":
                btnItem.border.radius = value;
                $("#luckysheet-modal-dialog-activeImage .luckysheet-modal-dialog-border").css("border-radius", value);
                break;
            case "border-style":
                btnItem.border.style = value;
                $("#luckysheet-modal-dialog-activeImage .luckysheet-modal-dialog-border").css("border-style", value);
                break;
            case "border-color":
                btnItem.border.color = value;
                $("#luckysheet-modal-dialog-activeImage .luckysheet-modal-dialog-border").css("border-color", value);
                break;
        }
        
        _this.ref();
    },
    getImgItemParam(btnItem){
        let isFixedPos = btnItem.isFixedPos;

        let width = btnItem.default.width,
            height = btnItem.default.height,
            left = btnItem.default.left,
            top = btnItem.default.top;

        if(btnItem.crop.width != width || btnItem.crop.height != height){
            width = btnItem.crop.width;
            height = btnItem.crop.height;
            left += btnItem.crop.offsetLeft;
            top += btnItem.crop.offsetTop;
        }

        let position = 'absolute';
        if(isFixedPos){
            position = 'fixed';
            left = btnItem.fixedLeft + btnItem.crop.offsetLeft;
            top = btnItem.fixedTop + btnItem.crop.offsetTop;
        }

        return {
            width: width,
            height: height,
            left: left,
            top: top,
            position: position
        }
    },
    cancelActiveImgItem: function(){
        let _this = this;

        $("#luckysheet-modal-dialog-activeImage").hide();
        $("#luckysheet-modal-dialog-cropping").hide();
        $("#luckysheet-modal-dialog-slider-buttonCtrl").hide();

        let btnItem = _this.buttons[_this.currentBtnId];
        let imgItemParam = _this.getImgItemParam(btnItem);

        let width = imgItemParam.width * Store.zoomRatio;
        let height = imgItemParam.height * Store.zoomRatio;
        let left = imgItemParam.left * Store.zoomRatio;
        let top = imgItemParam.top * Store.zoomRatio;
        let position = imgItemParam.position;

        $("#" + _this.currentBtnId).show().css({
            "width": width,
            "height": height,
            "left": left,
            "top": top,
            "position": position
        });
        $("#" + _this.currentBtnId + " img").css({
            "width": btnItem.default.width * Store.zoomRatio,
            "height": btnItem.default.height * Store.zoomRatio,
            "left": -btnItem.crop.offsetLeft * Store.zoomRatio,
            "top": -btnItem.crop.offsetTop * Store.zoomRatio
        });
        $("#" + _this.currentBtnId + " .luckysheet-modal-dialog-border").css({
            "border-width": btnItem.border.width * Store.zoomRatio,
            "border-style": btnItem.border.style,
            "border-color": btnItem.border.color,
            "border-radius": btnItem.border.radius * Store.zoomRatio,
            "left": -btnItem.border.width * Store.zoomRatio,
            "right": -btnItem.border.width * Store.zoomRatio,
            "top": -btnItem.border.width * Store.zoomRatio,
            "bottom": -btnItem.border.width * Store.zoomRatio,
        })

        _this.currentBtnId = null;
    },
    addBtnItem: function(btn) {
        let _this = this;

        let width, height;
        let max = 100;

        if(btn.originHeight < btn.originWidth){
            height = Math.round(btn.originHeight * (max / btn.originWidth));
            width = max;
        }
        else{
            width = Math.round(btn.originWidth * (max / btn.originHeight));
            height = max;
        }

        if(_this.buttons == null){
            _this.buttons = {};
        }

        let btnItem = $.extend(true, {}, _this.btnItem);
        btnItem.onclick = btn.onclick;
        btnItem.originWidth = btn.originWidth;
        btnItem.originHeight = btn.originHeight;
        btnItem.default.width = width;
        btnItem.default.height = height;
        btnItem.default.left = btn.left;
        btnItem.default.top = btn.top;
        btnItem.crop.width = width;
        btnItem.crop.height = height;

        let scrollTop = $("#luckysheet-cell-main").scrollTop(), 
            scrollLeft = $("#luckysheet-cell-main").scrollLeft();

        btnItem.fixedLeft = btn.left - scrollLeft + Store.rowHeaderWidth;
        btnItem.fixedTop = btn.top - scrollTop + Store.infobarHeight + Store.toolbarHeight + Store.calculatebarHeight + Store.columnHeaderHeight;

        let id = _this.generateRandomId();
        let modelHtml = _this.modelHtml(id, btnItem);

        $("#luckysheet-button-showBoxs .btn-list").append(modelHtml);

        _this.buttons[id] = btnItem;
        _this.ref();

        _this.init();
    },
    moveImgItem: function() {
        let _this = this;

        _this.move = false;

        let obj = $("#luckysheet-modal-dialog-activeImage")[0];
        let item = _this.buttons[_this.currentBtnId];

        if(item.isFixedPos){
            item.fixedLeft = obj.offsetLeft - item.crop.offsetLeft;
            item.fixedTop = obj.offsetTop - item.crop.offsetTop;
        }
        else{
            item.default.left = obj.offsetLeft - item.crop.offsetLeft;
            item.default.top = obj.offsetTop - item.crop.offsetTop;
        }

        _this.ref();
    },
    resizeImgItem: function() {
        let _this = this;

        _this.resize = null;

        let obj = $("#luckysheet-modal-dialog-activeImage")[0];

        let item = _this.buttons[_this.currentBtnId];
        let scaleX = obj.clientWidth / item.crop.width;
        let scaleY = obj.clientHeight / item.crop.height;

        item.default.width = Math.round(item.default.width * scaleX);
        item.default.height = Math.round(item.default.height * scaleY);

        item.crop.width = Math.round(item.crop.width * scaleX);
        item.crop.height = Math.round(item.crop.height * scaleY);
        item.crop.offsetLeft = Math.round(item.crop.offsetLeft * scaleX);
        item.crop.offsetTop = Math.round(item.crop.offsetTop * scaleY);

        if(item.isFixedPos){
            item.fixedLeft = obj.offsetLeft;
            item.fixedTop = obj.offsetTop;
        }
        else{
            item.default.left = obj.offsetLeft - item.crop.offsetLeft;
            item.default.top = obj.offsetTop - item.crop.offsetTop;
        }

        _this.ref();
    },
    croppingEnter: function() {
        let _this = this;
        _this.cropping = true;

        if(!checkProtectionAuthorityNormal(Store.currentSheetIndex, "editObjects",false)){
            return;
        }

        $("#luckysheet-modal-dialog-activeImage").hide();
        $("#luckysheet-modal-dialog-slider-buttonCtrl").hide();

        let item = _this.buttons[_this.currentBtnId];
        let imgItemParam = _this.getImgItemParam(item);

        let width = imgItemParam.width;
        let height = imgItemParam.height;
        let left = imgItemParam.left;
        let top = imgItemParam.top;
        let position = imgItemParam.position;
    
        $("#luckysheet-modal-dialog-cropping").show().css({
            "width": width,
            "height": height,
            "left": left,
            "top": top,
            "position": position
        });

        let imageUrlHandle = Store.toJsonOptions && Store.toJsonOptions['imageUrlHandle'];
        let imgSrc = typeof imageUrlHandle === 'function' ? imageUrlHandle(item.src) : item.src;

        $("#luckysheet-modal-dialog-cropping .cropping-mask").css({
            "width": item.default.width,
            "height": item.default.height,
            "background-image": "url(" + imgSrc + ")",
            "left": -item.crop.offsetLeft,
            "top": -item.crop.offsetTop
        })

        $("#luckysheet-modal-dialog-cropping .cropping-content").css({
            "background-image": "url(" + imgSrc + ")",
            "background-size": item.default.width + "px " + item.default.height + "px",
            "background-position": -item.crop.offsetLeft + "px " + -item.crop.offsetTop + "px"
        })

        $("#luckysheet-modal-dialog-cropping .luckysheet-modal-dialog-border").css({
            "border-width": item.border.width,
            "border-style": item.border.style,
            "border-color": item.border.color,
            "border-radius": item.border.radius,
            "left": -item.border.width,
            "right": -item.border.width,
            "top": -item.border.width,
            "bottom": -item.border.width,
        })
    },
    croppingExit: function() {
        let _this = this;
        _this.cropping = false;

        $("#luckysheet-modal-dialog-cropping").hide();

        let item = _this.buttons[_this.currentBtnId];
        let imgItemParam = _this.getImgItemParam(item);

        let width = imgItemParam.width;
        let height = imgItemParam.height;
        let left = imgItemParam.left;
        let top = imgItemParam.top;
        let position = imgItemParam.position;

        $("#luckysheet-modal-dialog-activeImage").show().css({
            "width": width,
            "height": height,
            "left": left,
            "top": top,
            "position": position
        });
        let imageUrlHandle = Store.toJsonOptions && Store.toJsonOptions['imageUrlHandle'];
        let imgSrc = typeof imageUrlHandle === 'function' ? imageUrlHandle(item.src) : item.src;

        $("#luckysheet-modal-dialog-activeImage .luckysheet-modal-dialog-content").css({
            "background-image": "url(" + imgSrc + ")",
            "background-size": item.default.width + "px " + item.default.height + "px",
            "background-position": -item.crop.offsetLeft + "px " + -item.crop.offsetTop + "px"
        })
    },
    cropChangeImgItem: function() {
        let _this = this;

        _this.cropChange = null;

        let item = _this.buttons[_this.currentBtnId];
        item.crop.width = _this.cropChangeObj.width;
        item.crop.height = _this.cropChangeObj.height;
        item.crop.offsetLeft = _this.cropChangeObj.offsetLeft;
        item.crop.offsetTop = _this.cropChangeObj.offsetTop;

        _this.ref();
    },
    restoreImgItem: function() {
        let _this = this;
        let btnItem = _this.buttons[_this.currentBtnId];

        btnItem.default.width = btnItem.originWidth;
        btnItem.default.height = btnItem.originHeight;

        btnItem.crop.width = btnItem.originWidth;
        btnItem.crop.height = btnItem.originHeight;
        btnItem.crop.offsetLeft = 0;
        btnItem.crop.offsetTop = 0;

        let imgItemParam = _this.getImgItemParam(btnItem);

        let width = imgItemParam.width;
        let height = imgItemParam.height;
        let left = imgItemParam.left;
        let top = imgItemParam.top;
        let position = imgItemParam.position;
        
        $("#luckysheet-modal-dialog-activeImage").show().css({
            "width": width,
            "height": height,
            "left": left,
            "top": top,
            "position": position
        });

        let imageUrlHandle = Store.toJsonOptions && Store.toJsonOptions['imageUrlHandle'];
        let imgSrc = typeof imageUrlHandle === 'function' ? imageUrlHandle(btnItem.src) : btnItem.src;

        $("#luckysheet-modal-dialog-activeImage .luckysheet-modal-dialog-content").css({
            "background-image": "url(" + imgSrc + ")",
            "background-size": btnItem.default.width + "px " + btnItem.default.height + "px",
            "background-position": -btnItem.crop.offsetLeft + "px " + -btnItem.crop.offsetTop + "px"
        })

        _this.ref();
    },
    removeImgItem: function() {
        let _this = this;
        let btnItem = _this.buttons[_this.currentBtnId];

        // 钩子 imageDeleteBefore
        if(!method.createHookFunction('imageDeleteBefore', btnItem)){
            return;
        }
        
        $("#luckysheet-modal-dialog-activeImage").hide();
        $("#luckysheet-modal-dialog-cropping").hide();
        $("#luckysheet-modal-dialog-slider-buttonCtrl").hide();
        $("#" + _this.currentBtnId).remove();


        delete _this.buttons[_this.currentBtnId];
        _this.currentBtnId = null;

        // 钩子 imageDeleteAfter
        method.createHookFunction('imageDeleteAfter', btnItem);
        _this.ref();
    },
    copyImgItem: function(e) {
        let _this = this;

        _this.copyImgItemObj = $.extend(true, {}, _this.buttons[_this.currentBtnId]);

        let clipboardData = window.clipboardData; //for IE
        if (!clipboardData) { // for chrome
            clipboardData = e.originalEvent.clipboardData;
        }

        let cpdata = '<table data-type="luckysheet_copy_action_image"><tr><td><td></tr></table>';

        if (!clipboardData) {
            let textarea = $("#luckysheet-copy-content");
            textarea.html(cpdata);
            textarea.focus();
            textarea.select();
            document.execCommand("selectAll");
            document.execCommand("Copy");
            // 等50毫秒，keyPress事件发生了再去处理数据
            setTimeout(function () { 
                $("#luckysheet-copy-content").blur(); 
            }, 10);
        }
        else {
            clipboardData.setData('Text', cpdata);
            return false;//否则设不生效
        }
    },
    pasteImgItem: function() {
        let _this = this;

        if(_this.buttons == null){
            _this.buttons = {};
        }

        let rowIndex = Store.luckysheet_select_save[0].row_focus || 0;
        let colIndex = Store.luckysheet_select_save[0].column_focus || 0;
        let left = colIndex == 0 ? 0 : Store.visibledatacolumn[colIndex - 1];
        let top = rowIndex == 0 ? 0 : Store.visibledatarow[rowIndex - 1];

        let img = $.extend(true, {}, _this.copyImgItemObj);
        
        img.default.left = left - img.crop.offsetLeft;
        img.default.top = top - img.crop.offsetTop;

        let scrollTop = $("#luckysheet-cell-main").scrollTop(), 
            scrollLeft = $("#luckysheet-cell-main").scrollLeft();

        img.fixedLeft = img.default.left - scrollLeft + Store.rowHeaderWidth;
        img.fixedTop = img.default.top - scrollTop + Store.infobarHeight + Store.toolbarHeight + Store.calculatebarHeight + Store.columnHeaderHeight;

        let id = _this.generateRandomId();
        let modelHtml = _this.modelHtml(id, img);

        $("#luckysheet-button-showBoxs .btn-list").append(modelHtml);

        _this.buttons[id] = img;
        _this.ref();

        _this.init();
    },
    allButtonsShow: function() {
        let _this = this;
        
        $("#luckysheet-modal-dialog-activeImage").hide();
        $("#luckysheet-modal-dialog-cropping").hide();
        $("#luckysheet-modal-dialog-slider-buttonCtrl").hide();
        $("#luckysheet-button-showBoxs .btn-list").empty();

        if(_this.buttons == null){
            return;
        }

        for(let imgId in _this.buttons){
            let btnItem = _this.buttons[imgId];
            let modelHtml = _this.modelHtml(imgId, btnItem);
            $("#luckysheet-button-showBoxs .btn-list").append(modelHtml);
        }
    },
    moveChangeSize: function(rc, index, size) {
        let _this = this;
        let buttons = $.extend(true, {}, _this.buttons);

        if(rc == "row"){
            let row = Store.visibledatarow[index], 
                row_pre = index - 1 == -1 ? 0 : Store.visibledatarow[index - 1];
            let changeSize = size - (row - row_pre - 1);
            
            for(let imgId in buttons){
                let btnItem = buttons[imgId];
                let imgItemParam = _this.getImgItemParam(btnItem);
                let type = btnItem.type;

                if(type == "1"){
                    if(imgItemParam.top >= row){
                        btnItem.default.top = imgItemParam.top + changeSize - btnItem.crop.offsetTop;
                    }
                    else{
                        if(imgItemParam.top + imgItemParam.height >= row-2){
                            if(imgItemParam.top < row + changeSize){
                                let scaleY = (imgItemParam.height + changeSize) / imgItemParam.height;
                                btnItem.default.height = Math.round(btnItem.default.height * scaleY);
                                btnItem.crop.height = Math.round(btnItem.crop.height * scaleY);
                                btnItem.crop.offsetTop = Math.round(btnItem.crop.offsetTop * scaleY);
                            }
                            else{
                                let scaleY = (imgItemParam.top + imgItemParam.height - row) / imgItemParam.height;
                                btnItem.default.height = Math.round(btnItem.default.height * scaleY);
                                btnItem.crop.height = Math.round(btnItem.crop.height * scaleY);
                                btnItem.crop.offsetTop = Math.round(btnItem.crop.offsetTop * scaleY);
                                btnItem.default.top = row + changeSize - btnItem.crop.offsetTop;
                            }
                        }
                        else{
                            if(imgItemParam.top > row + changeSize){
                                let scaleY = 1 / imgItemParam.height;
                                btnItem.default.height = Math.round(btnItem.default.height * scaleY);
                                btnItem.crop.height = Math.round(btnItem.crop.height * scaleY);
                                btnItem.crop.offsetTop = Math.round(btnItem.crop.offsetTop * scaleY);
                                btnItem.default.top = row + changeSize - btnItem.crop.offsetTop;
                            }
                            else if(imgItemParam.top + imgItemParam.height > row + changeSize){
                                let scaleY = (row + changeSize - imgItemParam.top) / imgItemParam.height;
                                btnItem.default.height = Math.round(btnItem.default.height * scaleY);
                                btnItem.crop.height = Math.round(btnItem.crop.height * scaleY);
                                btnItem.crop.offsetTop = Math.round(btnItem.crop.offsetTop * scaleY);
                            }
                        }
                    }
                }
                else if(type == "2"){
                    if(imgItemParam.top >= row){
                        btnItem.default.top = imgItemParam.top + changeSize - btnItem.crop.offsetTop;
                    }
                    else if(imgItemParam.top > row + changeSize){
                        btnItem.default.top = row + changeSize - btnItem.crop.offsetTop;
                    }
                }
            }
        }
        else if(rc == "column"){
            let col = Store.visibledatacolumn[index], 
                col_pre = index - 1 == -1 ? 0 : Store.visibledatacolumn[index - 1];
            let changeSize = size - (col - col_pre - 1);

            for(let imgId in buttons){
                let btnItem = buttons[imgId];
                let imgItemParam = _this.getImgItemParam(btnItem);
                let type = btnItem.type;

                if(type == "1"){
                    if(imgItemParam.left >= col){
                        btnItem.default.left = imgItemParam.left + changeSize - btnItem.crop.offsetLeft;
                    }
                    else{
                        if(imgItemParam.left + imgItemParam.width >= col-2){
                            if(imgItemParam.left < col + changeSize){
                                let scaleX = (imgItemParam.width + changeSize) / imgItemParam.width;
                                btnItem.default.width = Math.round(btnItem.default.width * scaleX);
                                btnItem.crop.width = Math.round(btnItem.crop.width * scaleX);
                                btnItem.crop.offsetLeft = Math.round(btnItem.crop.offsetLeft * scaleX);
                            }
                            else{
                                let scaleX = (imgItemParam.left + imgItemParam.width - col) / imgItemParam.width;
                                btnItem.default.width = Math.round(btnItem.default.width * scaleX);
                                btnItem.crop.width = Math.round(btnItem.crop.width * scaleX);
                                btnItem.crop.offsetLeft = Math.round(btnItem.crop.offsetLeft * scaleX);
                                btnItem.default.left = col + changeSize - btnItem.crop.offsetLeft;
                            }
                        }
                        else{
                            if(imgItemParam.left > col + changeSize){
                                let scaleX = 1 / imgItemParam.width;
                                btnItem.default.width = Math.round(btnItem.default.width * scaleX);
                                btnItem.crop.width = Math.round(btnItem.crop.width * scaleX);
                                btnItem.crop.offsetLeft = Math.round(btnItem.crop.offsetLeft * scaleX);
                                btnItem.default.left = col + changeSize - btnItem.crop.offsetLeft;
                            }
                            else if(imgItemParam.left + imgItemParam.width > col + changeSize){
                                let scaleX = (col + changeSize - imgItemParam.left) / imgItemParam.width;
                                btnItem.default.width = Math.round(btnItem.default.width * scaleX);
                                btnItem.crop.width = Math.round(btnItem.crop.width * scaleX);
                                btnItem.crop.offsetLeft = Math.round(btnItem.crop.offsetLeft * scaleX);
                            }
                        }
                    }
                }
                else if(type == "2"){
                    if(imgItemParam.left >= col){
                        btnItem.default.left = imgItemParam.left + changeSize - btnItem.crop.offsetLeft;
                    }
                    else if(imgItemParam.left > col + changeSize){
                        btnItem.default.left = col + changeSize - btnItem.crop.offsetLeft;
                    }
                }
            }
        }

        return buttons;
    },
    ref: function() {
        let _this = this;

        let file = Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)];
        let buttons = _this.buttons;

        if (Store.clearjfundo) {
            Store.jfundo.length  = 0;

            Store.jfredo.push({
                "type": "buttonCtrl",
                "sheetIndex": Store.currentSheetIndex,
                "buttons": file.buttons == null ? null : $.extend(true, {}, file.buttons),
                "curImages": buttons
            });
        }

        file.buttons = $.extend(true, {}, buttons);
        server.saveParam("all", Store.currentSheetIndex, file.buttons, { "k": "buttons" });
    },
}

export default buttonCtrl;