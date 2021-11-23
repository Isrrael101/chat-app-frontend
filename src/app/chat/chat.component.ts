import { Mensaje } from './models/mensaje';
import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
  mensaje: Mensaje = new Mensaje(); 
  private client: Client;
  conectado: boolean = false;
  mensajes: Mensaje[]= [];
  escribiendo: String;
  constructor() {}

  ngOnInit(): void {
    this.client = new Client();
    //Asignamos el sock JS al stomp
    this.client.webSocketFactory = () => {
      return new SockJS('http://localhost:8080/chat-websocket');
    };

    this.client.onConnect = (frame) => {
      console.log('Conectados: ' + this.client.connected + ': ' + frame);
      this.conectado = true;

      this.client.subscribe('/chat/mensaje', e => {
        let mensaje: Mensaje = JSON.parse(e.body) as Mensaje;
        mensaje.fecha = new Date(mensaje.fecha);

        if(!this.mensaje.color && mensaje.tipo == 'NUEVO_USUARIO' && this.mensaje.username == mensaje.username) {
          this.mensaje.color = mensaje.color;
        }

        this.mensajes.push(mensaje);
        console.log(mensaje.texto);
      });

      this.client.subscribe('/chat/escribiendo', e => {
        this.escribiendo = e.body;
        setTimeout(() => this.escribiendo = '', 3000)
      });

      this.mensaje.tipo = "NUEVO_USUARIO";
      this.client.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)});
    };

    this.client.onDisconnect = (frame) => {
      console.log('Desconectados: ' + !this.client.connected + ': ' + frame);
      this.conectado = false;
    };
  }

  conectar(): void {
    this.client.activate();
  }

  desconectar(): void {
    this.client.deactivate();
  }

  enviarMensaje(): void {
    this.mensaje.tipo = "MENSAJE";
    this.client.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)});
    this.mensaje.texto = '';
  }

  escribirEvento(): void {
    this.client.publish({destination: '/app/escribiendo', body: JSON.stringify(this.mensaje.username)});
  }
}