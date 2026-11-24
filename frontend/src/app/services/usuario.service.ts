import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly apiUrl = 'http://localhost:3000/usuarios';

  constructor(private readonly http: HttpClient) {}

  guardar(usuario: unknown): Observable<any> {
    return this.http.post(this.apiUrl, usuario).pipe(catchError(this.handleError));
  }

  login(usuario: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { usuario, password }).pipe(catchError(this.handleError));
  }

  listarUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(catchError(this.handleError));
  }

  suspenderUsuario(id: number, duracion: string, rolSolicitante: string): Observable<any> {
    const headers = new HttpHeaders({ 'x-user-role': rolSolicitante });
    return this.http
      .patch(`${this.apiUrl}/${id}/suspender`, { duracion }, { headers })
      .pipe(catchError(this.handleError));
  }

  reactivarUsuario(id: number, rolSolicitante: string): Observable<any> {
    const headers = new HttpHeaders({ 'x-user-role': rolSolicitante });
    return this.http
      .patch(`${this.apiUrl}/${id}/reactivar`, {}, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const mensajeError = error?.error?.message || error?.message || 'Error desconocido';
    return throwError(() => ({
      status: error?.status,
      message: mensajeError,
      error: error,
    }));
  }
}
