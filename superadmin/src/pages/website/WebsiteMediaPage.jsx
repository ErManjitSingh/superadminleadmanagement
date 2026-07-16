import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Trash2, Upload } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea } from '../../components/ui/input';

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function WebsiteMediaPage() {
  const qc = useQueryClient();
  const [folder, setFolder] = useState('root');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState([]);
  const [newFolder, setNewFolder] = useState('');
  const [editing, setEditing] = useState(null);
  const [urlImport, setUrlImport] = useState('');

  const params = useMemo(() => ({ folder: folder || undefined, q: q || undefined, limit: 48 }), [folder, q]);

  const { data, isLoading } = useQuery({
    queryKey: ['website-media', params],
    queryFn: () => superAdminApi.listWebsiteMedia(params).then((r) => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (files) => superAdminApi.uploadWebsiteMedia({ folder, files }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-media'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => superAdminApi.updateWebsiteMedia(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-media'] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids) => (ids.length === 1
      ? superAdminApi.deleteWebsiteMedia(ids[0])
      : superAdminApi.bulkDeleteWebsiteMedia(ids)),
    onSuccess: () => {
      setSelected([]);
      qc.invalidateQueries({ queryKey: ['website-media'] });
    },
  });

  const folderMutation = useMutation({
    mutationFn: () => superAdminApi.createWebsiteMediaFolder(newFolder),
    onSuccess: () => {
      setFolder(newFolder);
      setNewFolder('');
      qc.invalidateQueries({ queryKey: ['website-media'] });
    },
  });

  async function onFilesSelected(e) {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;
    const files = await Promise.all(fileList.map(async (file) => ({
      originalName: file.name,
      mimeType: file.type,
      dataUrl: await readAsDataUrl(file),
      alt: file.name,
      title: file.name,
    })));
    uploadMutation.mutate(files);
    e.target.value = '';
  }

  const items = data?.data || [];
  const folders = data?.folders || ['root'];

  return (
    <div className="space-y-6">
      <PageHeader title="Media Library" description="Folders, bulk upload, alt text, captions, WebP/AVIF-ready metadata.">
        <label className="inline-flex cursor-pointer">
          <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={onFilesSelected} />
          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-4 text-sm font-medium text-white shadow-md">
            <Upload className="h-4 w-4" /> Upload
          </span>
        </label>
      </PageHeader>

      <div className="flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search media…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="h-10 rounded-xl border px-3 text-sm" value={folder} onChange={(e) => setFolder(e.target.value)}>
          {folders.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <Input className="max-w-[180px]" placeholder="New folder" value={newFolder} onChange={(e) => setNewFolder(e.target.value)} />
        <Button variant="secondary" onClick={() => folderMutation.mutate()} disabled={!newFolder}><FolderPlus className="h-4 w-4" /> Create</Button>
        {selected.length > 0 && (
          <Button variant="destructive" onClick={() => deleteMutation.mutate(selected)}><Trash2 className="h-4 w-4" /> Delete ({selected.length})</Button>
        )}
      </div>

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[280px] flex-1">
          <Label>Import by URL</Label>
          <Input value={urlImport} onChange={(e) => setUrlImport(e.target.value)} placeholder="https://cdn.example.com/image.jpg" />
        </div>
        <Button
          variant="secondary"
          disabled={!urlImport}
          onClick={() => {
            uploadMutation.mutate([{ url: urlImport, originalName: urlImport.split('/').pop(), mimeType: 'image/*' }]);
            setUrlImport('');
          }}
        >
          Import URL
        </Button>
      </Card>

      {editing && (
        <Card className="space-y-3 p-4">
          <h3 className="font-semibold">Edit metadata</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Title</Label><Input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><Label>Alt text</Label><Input value={editing.alt || ''} onChange={(e) => setEditing({ ...editing, alt: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Caption</Label><Textarea rows={2} value={editing.caption || ''} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} /></div>
            <div><Label>Folder</Label><Input value={editing.folder || 'root'} onChange={(e) => setEditing({ ...editing, folder: e.target.value })} /></div>
            <div><Label>WebP URL</Label><Input value={editing.webpUrl || ''} onChange={(e) => setEditing({ ...editing, webpUrl: e.target.value })} /></div>
            <div><Label>AVIF URL</Label><Input value={editing.avifUrl || ''} onChange={(e) => setEditing({ ...editing, avifUrl: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => updateMutation.mutate(editing)}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      {isLoading ? <div className="py-12 text-center">Loading media…</div> : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden p-0">
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                {String(item.mimeType || '').startsWith('image') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(item.url) ? (
                  <img src={item.url} alt={item.alt || item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">{item.mimeType || 'file'}</div>
                )}
                <input
                  type="checkbox"
                  className="absolute left-2 top-2"
                  checked={selected.includes(item.id)}
                  onChange={(e) => setSelected((prev) => (e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)))}
                />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium">{item.title || item.originalName}</p>
                <p className="truncate text-[10px] text-[var(--text-muted)]">{item.url}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(item)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate([item.id])}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
