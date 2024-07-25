import * as L from 'leaflet';

// Define an interface for the field objects
interface Field {
  name: string;
  default: string;
  multiline: boolean;
}

export class FormPopup extends L.Popup {
  private fields: Field[];
  private inputElems: any[] = [];
  private _dataListener: (data: object) => void = () => undefined;
    private _container!: HTMLDivElement;
    private _wrapper!: HTMLDivElement;
    private _contentNode!: HTMLDivElement;
    private _closeButton!: HTMLAnchorElement;
    private _source!: any;

    constructor(private title:string,fields: Field[], options?: L.PopupOptions) {
        super(options);
        this.fields = fields;
    }

    override onAdd(map: L.Map): this {
        // Override onAdd method to handle map interactions
        console.log("Form popup on add called");
        super.onAdd(map);
        map.fire('popupopen', { popup: this });
        this._updateLayout();
        this._map = map;
    
        const draggable = new L.Draggable(this._container, this._wrapper);
        draggable.enable();
        // @ts-ignore
        L.DomEvent.on(draggable, 'dragend', () => {
            // @ts-ignore
            const pos = this._map.layerPointToLatLng(draggable._newPos as L.Point); 
            this.setLatLng(pos);
        }, this);
    
        this._map.on('zoom', () => {
            this.setLatLng(map.getCenter());
        }, this);
    
        if (this._source) {
            this._source.fire('popupopen', { popup: this }, true);
            if (!(this._source instanceof L.Path)) {
            this._source.on('preclick', L.DomEvent.stopPropagation);
            }
        }
    
        return this;
    }

    protected _updateLayout(): void {
        const container = this._container;
        const wrapper = this._wrapper;
        const wheight = wrapper.offsetHeight;
        const cheight = container.offsetHeight;
        console.log(wrapper.clientHeight,container.clientHeight);
        console.log(wrapper.scrollHeight,container.scrollHeight);
        console.log("update layout checking ",wheight,cheight);
        if(wheight > cheight){
            container.style.setProperty('height',`${wheight + 100}px`);
            console.log("property changed update layout");
        }
        
      }

      // Override _initLayout method to customize layout
    protected _initLayout(): void {
        const prefix = 'leaflet-popup';
        const container = this._container = L.DomUtil.create('div', `${prefix} .leaflet-form-popup leaflet-zoom-animated`);
        
        const wrapper = this._wrapper = L.DomUtil.create('div', `${prefix}-content-wrapper`, container);
        this._contentNode = L.DomUtil.create('div', `${prefix}-content`, wrapper);
        this._contentNode.textContent = this.title;
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(container, 'contextmenu', L.DomEvent.stopPropagation);
        
        const closeButton = this._closeButton = L.DomUtil.create('a', `${prefix}-close-button`, container);
        closeButton.setAttribute('role', 'button');
        closeButton.setAttribute('aria-label','Close Form');

        closeButton.href = '#close';
        closeButton.innerHTML = '<span aria-hidden="true">&#215;</span>';

        L.DomEvent.on(closeButton, 'click', (ev) => {
        L.DomEvent.preventDefault(ev);
        this.close();
        this.remove();
        this.callDataListener({ close: true });
        }, this);

        this.createInputElements();
    }
  // Method to add a data listener
  addDataListener(func: (data: object) => void): void {
    this._dataListener = func;
  }

  // Method to call the data listener
  private callDataListener(data: object): void {
    this._dataListener({ ...data, latlng: this.getLatLng() });
  }

  

  override setContent(htmlContent: ((source: L.Layer) => L.Content) | L.Content): this {
      return this;
  }

  // Method to create input elements based on fields
  private createInputElements(): void {
    const prefix = 'leaflet-popup';

    for (const field of this.fields) {
      const formDiv = L.DomUtil.create('div', `${prefix}-form-div`, this._wrapper);
      const labelElem = L.DomUtil.create('label', `${prefix}-form-div-label`, formDiv);
      labelElem.setAttribute('for', field.name);
      labelElem.textContent = field.name;

      const inputElem = L.DomUtil.create(field.multiline ? 'textarea' : 'input', `${prefix}-form-div-input`, formDiv) as HTMLInputElement | HTMLTextAreaElement;
      inputElem.id = field.name;
      inputElem.value = field.default || '';
      this.inputElems.push(inputElem);
    }

    const buttonGrp = L.DomUtil.create('div', `${prefix}-div-btn-grp formmode`, this._wrapper);
    const saveBtn = L.DomUtil.create('button', `${prefix}-div-btn`, buttonGrp);
    saveBtn.textContent = "Save";

    L.DomEvent.on(saveBtn, 'click', (e) => {
      this._onSaveBtnClick(e);
      L.DomEvent.stopPropagation(e);
    }, this);

    const cancelBtn = L.DomUtil.create('button', `${prefix}-div-btn`, buttonGrp);
    cancelBtn.textContent = "Cancel";

    L.DomEvent.on(cancelBtn, 'click', (e) => {
      this._onCancelBtnClick(e);
      L.DomEvent.stopPropagation(e);
    }, this);
  }

  // Event handler for Save button click
  private _onSaveBtnClick(e: Event): void {
    const payload: Record<string, any> = { actiontype: 'save' };
    for (const elem of this.inputElems) {
      const key = elem.id;
      const value = elem.value;
      payload[key] = value;
    }

    this.callDataListener(payload);
    L.DomEvent.stopPropagation(e);
  }

  // Event handler for Cancel button click
  private _onCancelBtnClick(e: Event): void {
    const payload: { type: string; values: Record<string, any> } = { type: 'cancel', values: {} };
    for (const elem of this.inputElems) {
      const key = elem.id;
      const value = elem.value;
      payload.values[key] = value;
    }

    this.callDataListener(payload);
    L.DomEvent.stopPropagation(e);
  }
    
}

// Factory function to create a FormPopup instance
export const formpopup = (title:string,fields: Field[], options?: L.PopupOptions) => new FormPopup(title,fields, options);
