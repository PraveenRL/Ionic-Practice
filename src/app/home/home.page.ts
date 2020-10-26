import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';

import { FileOpener } from '@ionic-native/file-opener/ngx';
import { Platform } from '@ionic/angular';
import { CameraResultType, CameraSource, FilesystemDirectory, Plugins } from '@capacitor/core';

const { Camera, FileSystem } = Plugins;

import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  myForm: FormGroup;
  pdfObj = null;
  base64Image = null;
  photoPreview = null;
  logoData = null;

  constructor(
    private fb: FormBuilder,
    private plt: Platform,
    private http: HttpClient,
    private fileOpener: FileOpener
  ) { }

  ngOnInit() {
    this.myForm = this.fb.group({
      showLogo: true,
      from: 'Show',
      to: 'Max',
      text: 'Test'
    })
    this.loadLocalAssetToBase64();
  }

  loadLocalAssetToBase64() {
    this.http.get('assets/images/cat.jpg', { responseType: 'blob' })
      .subscribe(res => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.logoData = reader.result;
        }
        reader.readAsDataURL(res);
      })
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    });

    this.photoPreview = `data:image/jpeg;base64,${image.base64String}`;
  }

  createPdf() {
    const formValue = this.myForm.value;
    const image = this.photoPreview ? { image: this.photoPreview, width: 300 } : {};

    let logo = {};
    if (formValue.showLogo) {
      logo = {
        image: this.logoData,
        width: 50
      };
    }

    const docDefinition = {
      watermark: {
        text: 'Ionic PDF',
        color: 'blue',
        opacity: 0.2,
        bold: true
      },
      content: [
        {
          columns: [
            logo,
            {
              text: new Date().toISOString(),
              alignment: 'right'
            }
          ]
        },
        {
          text: 'REMINDER',
          style: 'header'
        },
        {
          columns: [
            {
              width: '50%',
              text: 'From',
              style: 'subheader'
            },
            {
              width: '50%',
              text: 'To',
              style: 'subheader'
            }
          ]
        },
        {
          columns: [
            {
              width: '50%',
              text: formValue.from,
            },
            {
              width: '50%',
              text: formValue.to,
            }
          ]
        },
        image,
        {
          text: formValue.text,
          margin: [0, 20, 0, 20]
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 15, 0, 0]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 0]
        }
      }
    }

    this.pdfObj = pdfMake.createPdf(docDefinition);
    console.log(this.pdfObj)
  }

  downloadPdf() {
    if (this.plt.is('android')) {
      this.pdfObj.getBase64(async (data) => {
        try {
          let path = `pdf/myletter_${Date.now()}.pdf`;

          const result = await FileSystem.writeFile({
            path,
            data,
            directory: FilesystemDirectory.Documents,
            recursive: true
          });

          this.fileOpener.open(`${result.uri}`, 'application/pdf');
        }
        catch (error) {
          window.alert(error);
        }
      });
    } else {
      this.pdfObj.download();
    }
  }

}