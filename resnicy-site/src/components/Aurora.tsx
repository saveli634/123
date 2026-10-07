/**
 * «Сияние» на чистом CSS: мягкие фиолетовые пятна и атласные блики медленно плывут.
 * Лежит под WebGL-«шёлком»; без скриптов (предпросмотр файла на телефоне) или без WebGL — видно само.
 */
export function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="au au1" />
      <span className="au au2" />
      <span className="au au3" />
      <span className="au au4" />
      <span className="rib rib1" />
      <span className="rib rib2" />
      <span className="rib rib3" />
    </div>
  );
}
