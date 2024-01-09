import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {GetContextMenuItemsParams,MenuItemDef,ColDef} from 'ag-grid-community'
import { ButtonRendererComponent } from './button-renderer/button-renderer.component';
import 'ag-grid-enterprise'
import { GridApi, RowModelType } from 'ag-grid-enterprise';
import { ServerSideComponent } from '../server-side/server-side.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet,AgGridModule,ServerSideComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

    rowData:any =  [];
    errorMessage : string = "";
    frameworkComponents : any;
    gridApi : any ; 
    rowModelType : RowModelType | undefined = "serverSide"
  
    colDefs: ColDef[] = [
      {
        headerName:"#",
        valueGetter:(params:any)=>params.node.rowIndex+1,
        width:30,
        floatingFilter:false
      },
      { field: "name" },
      { field: "summary" },
      { field: "author" },
      { field: "publishDate",valueFormatter:(params:any)=>{
        return new Date(params.value).toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'});
      } },
      {
      headerName:"Operations",
        cellRenderer:ButtonRendererComponent,
        cellRendererParams:{
          onClick:this.remove.bind(this),
          label:'Remove'
        }
       }
    ];

    defaultColDef :any = {
      editable : this.checkAuthorization(),
      filter :true,
      onCellValueChanged :(params:any)=> this.update(params),
      floatingFilter:true,
      enableSetEdit:true
    }

gridOptions : any = {
  overlayLoadingTemplate:
  `<span class="ag-overlay-loading-center">Yükleniyor</span>`,
  // overlayNoRowsTemplate:
  // `<span style="padding: 10px;">errorMessage || 'Gösterilecke herhangi bir veri bulunmamaktadır.'</span>`
  overlayNoRowsTemplate: `<span style="padding: 10px;">Gösterilecek veri bulunmamaktadır.</span>`
}
   autoSizeStrategy : any = {
    type: 'fitGridWidth'
  };

    constructor(private http:HttpClient){
      this.frameworkComponents = {
        buttonRenderer : ButtonRendererComponent
      }

      this.http.get("https://localhost:7213/api/Values/GetAll").subscribe(res=>{
        this.rowData = res;
      })
    }

    onGridReady(params: any) {
      this.gridApi = params.api
      params.api.showLoadingOverlay();
      this.getAll(params);
    }

    remove(event:any){
      console.log(event.rowData);
      
    }

    getContextMenuItems(params:GetContextMenuItemsParams):(string | MenuItemDef)[]{
      var result : (string | MenuItemDef)[] = [
        {
          name:"Example Action",
          action : () =>{
            console.log("Örnek aksiyon çalıştırıldı...");
            console.log(params?.node?.data);
          }
        },
        {
          name : "Excel Export",
          icon:`<i class="fa-solid fa-download"></i>`,
          subMenu:[
           { 
            name:"Excel Export",
            action :() => {
              params.api.exportDataAsExcel();
            }
          }
          ]
        },
        'copy',
        'seperator',
        'paste'
      ]
      return result;
    }

    onFilterTextBoxChanged() {
      this.gridApi.setGridOption(
        'quickFilterText',
        (document.getElementById('filter-text-box') as HTMLInputElement).value
      );
    }

    onRowDoubleClicked(event:any){
      console.log(event.data);
    }

    checkAuthorization(){
      return true;
    }

    getAll(params:any = null){
      this.http.get("https://localhost:7213/api/Values/GetAll").subscribe({
        next:(res:any)=>{
          params?.api?.hideOverlay();
          this.rowData = res;
          if(res.length<=0){
            params?.api?.showNoRowsOverlay();
          }
        },

        error:(err:HttpErrorResponse)=>{
          params?.api?.showNoRowsOverlay();
          params?.api?.hideOverlay();
          console.error("Veri alınamadı. Hata: ", err);
          this.errorMessage = "Veri alınamadı. Hata: " + err.message;
          params.api.setRowData([]);
        }
      })
    }

    assign(){
      alert("Assigned")
    }

    update(params:any){
    console.log(params.data);
      this.http.post("https://localhost:7213/api/Values/Update",params.data)
      .subscribe(res=>{
      this.getAll();
      })


    }
}
