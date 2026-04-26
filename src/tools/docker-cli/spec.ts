import type { ReferenceSpec } from "../reference-tool";

export const spec: ReferenceSpec = {
  bilingualColumn: 1,
  columns: [
    { tr: "Komut", en: "Command" },
    { tr: "Ne yapar", en: "What it does" },
  ],
  rows: [
    [
      "docker ps -a",
      "Durmuş olanlar dahil tüm konteynerler / Every container, stopped ones included",
    ],
    ["docker logs -f --tail 100 <ad>", "Son 100 satır ve canlı takip"],
    ["docker exec -it <ad> sh", "Çalışan konteynerde kabuk aç"],
    [
      "docker run --rm -it <imaj> sh",
      "Tek seferlik konteyner, çıkınca silinir",
    ],
    ["docker build -t ad:etiket .", "İmaj derle ve etiketle"],
    ["docker build --no-cache .", "Önbelleksiz derle"],
    ["docker inspect <ad>", "Tüm yapılandırmayı JSON olarak gör"],
    ["docker stats", "Canlı CPU ve bellek kullanımı"],
    ["docker cp <ad>:/yol ./yerel", "Konteynerden dosya kopyala"],
    ["docker image prune -a", "Kullanılmayan imajları sil"],
    ["docker system df", "Disk kullanımını dök"],
    [
      "docker system prune -a --volumes",
      "Her şeyi temizle (yıkıcı) / Clean everything (destructive)",
    ],
    ["docker compose up -d --build", "Derle ve arka planda başlat"],
    ["docker compose logs -f <servis>", "Bir servisin loglarını takip et"],
    ["docker compose exec <servis> sh", "Servis içinde kabuk"],
    ["docker compose down -v", "Durdur ve volume'leri sil"],
    ["docker compose config", "Birleştirilmiş yapılandırmayı gör"],
    ["docker volume ls / rm", "Volume listele / sil"],
    ["docker network inspect <ağ>", "Ağdaki konteynerleri ve IP'leri gör"],
    ["docker save / load", "İmajı tar olarak dışa/içe aktar"],
  ],
};
