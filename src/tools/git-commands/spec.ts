import type { ReferenceSpec } from "../reference-tool";

export const spec: ReferenceSpec = {
  bilingualColumn: 1,
  columns: [
    { tr: "Komut", en: "Command" },
    { tr: "Ne yapar", en: "What it does" },
  ],
  rows: [
    [
      "git status -sb",
      "Kısa durum ve dal bilgisi / Short status with branch info",
    ],
    [
      "git add -p",
      "Değişiklikleri parça parça seç / Stage changes hunk by hunk",
    ],
    [
      "git commit --amend --no-edit",
      "Son commit'e ekle, mesajı değiştirme / Add to the last commit, keep its message",
    ],
    [
      "git restore <dosya>",
      "Çalışma alanındaki değişikliği geri al / Discard a working-tree change",
    ],
    [
      "git restore --staged <dosya>",
      "Staged'dan çıkar, değişikliği koru / Unstage, keeping the change",
    ],
    [
      "git switch -c <dal>",
      "Yeni dal aç ve geç / Create a branch and switch to it",
    ],
    ["git switch -", "Bir önceki dala dön / Back to the previous branch"],
    [
      "git log --oneline --graph --all",
      "Dalları grafik olarak gör / See the branches as a graph",
    ],
    [
      "git log -p <dosya>",
      "Bir dosyanın değişim geçmişi / A file's change history",
    ],
    [
      'git log -S"metin"',
      "Bu metni ekleyen/silen commit'ler / Commits that added or removed this text",
    ],
    [
      "git blame -L 10,20 <dosya>",
      "Belirli satırları kim yazdı / Who wrote these lines",
    ],
    ["git diff --staged", "Staged değişiklikleri gör / See what is staged"],
    [
      "git diff main...HEAD",
      "Daldan sonra eklenenler / What this branch added since main",
    ],
    [
      'git stash push -m "not"',
      "Değişiklikleri isimle rafa kaldır / Shelve changes with a name",
    ],
    ["git stash pop", "Raftan geri al / Bring them back"],
    [
      "git rebase -i HEAD~3",
      "Son üç commit'i düzenle / Rewrite the last three commits",
    ],
    [
      "git rebase --onto main eski yeni",
      "Dalı başka bir tabana taşı / Move a branch onto another base",
    ],
    ["git cherry-pick <sha>", "Tek commit'i buraya al / Bring one commit here"],
    [
      "git revert <sha>",
      "Commit'i geri alan yeni commit / A new commit that undoes one",
    ],
    [
      "git reset --soft HEAD~1",
      "Commit'i çöz, değişiklikleri staged bırak / Undo the commit, keep it staged",
    ],
    [
      "git reset --hard <sha>",
      "Her şeyi o commit'e döndür (yıkıcı) / Reset everything to that commit (destructive)",
    ],
    [
      "git reflog",
      "Kaybolan commit'leri bul / Find commits you thought were gone",
    ],
    [
      "git clean -nd",
      "Silinecek takipsiz dosyaları listele / List untracked files that would be deleted",
    ],
    [
      "git fetch --prune",
      "Silinmiş uzak dalları temizle / Drop remote branches that no longer exist",
    ],
    [
      "git push --force-with-lease",
      "Güvenli zorla push / Force push without clobbering someone else",
    ],
    [
      "git worktree add ../dizin <dal>",
      "Aynı repoyu ikinci dizinde aç / Check out a second working tree",
    ],
    [
      "git bisect start / good / bad",
      "Hatayı ikili aramayla bul / Binary-search for the commit that broke it",
    ],
    ["git shortlog -sn", "Kim kaç commit atmış / Who committed how much"],
    ['git tag -a v1.0 -m "…"', "Açıklamalı etiket / An annotated tag"],
    ["git remote -v", "Uzak adresleri göster / Show the remotes"],
  ],
};
