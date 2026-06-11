import React, { useEffect, useState } from 'react';
import { Edit, Plus, Tag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/commerce';

const emptyProduct = {
  name: '',
  slug: '',
  category_id: '',
  short_description: '',
  description: '',
  price: '',
  compare_at_price: '',
  stock: '',
  rating: '',
  image_url: '',
  featured: false,
  active: true,
};

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productResult, categoryResult] = await Promise.all([
        pb.collection('products').getList(1, 200, { sort: '-created', $autoCancel: false }),
        pb.collection('product_categories').getList(1, 100, { sort: 'sort_order', $autoCancel: false }),
      ]);
      setProducts(productResult.items);
      setCategories(categoryResult.items);
    } catch (error) {
      console.error(error);
      toast.error('Could not load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openProductDialog = (product = null) => {
    setSelectedProduct(product);
    setFormData(product ? {
      name: product.name,
      slug: product.slug,
      category_id: product.category_id,
      short_description: product.short_description,
      description: product.description,
      price: product.price,
      compare_at_price: product.compare_at_price || '',
      stock: product.stock,
      rating: product.rating || '',
      image_url: product.image_url,
      featured: product.featured,
      active: product.active,
    } : { ...emptyProduct, category_id: categories[0]?.id || '' });
    setProductDialogOpen(true);
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === 'name' && !selectedProduct
        ? { slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
        : {}),
    }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    const payload = {
      ...formData,
      price: Number(formData.price),
      compare_at_price: Number(formData.compare_at_price || 0),
      stock: Number(formData.stock),
      rating: Number(formData.rating || 0),
      gallery: formData.image_url ? [formData.image_url] : [],
      tags: [],
    };

    try {
      if (selectedProduct) {
        await pb.collection('products').update(selectedProduct.id, payload, { $autoCancel: false });
        toast.success('Product updated');
      } else {
        await pb.collection('products').create(payload, { $autoCancel: false });
        toast.success('Product created');
      }
      setProductDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Could not save product');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (product) => {
    try {
      await pb.collection('products').delete(product.id, { $autoCancel: false });
      setProducts((items) => items.filter((item) => item.id !== product.id));
      toast.success('Product deleted');
    } catch (error) {
      console.error(error);
      toast.error('Could not delete product');
    }
  };

  const createCategory = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await pb.collection('product_categories').create({
        name: categoryName,
        slug: categoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        sort_order: categories.length + 1,
        active: true,
      }, { $autoCancel: false });
      setCategoryName('');
      setCategoryDialogOpen(false);
      await loadData();
      toast.success('Category created');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Could not create category');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryLabel = (id) => categories.find((category) => category.id === id)?.name || 'Uncategorized';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">{products.length} products across {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}><Tag className="mr-2 h-4 w-4" /> Categories</Button>
          <Button onClick={() => openProductDialog()}><Plus className="mr-2 h-4 w-4" /> New product</Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center">Loading products...</TableCell></TableRow>
            ) : products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={product.image_url} alt="" className="h-11 w-11 rounded-lg object-cover" />
                    <span className="font-medium">{product.name}</span>
                  </div>
                </TableCell>
                <TableCell>{categoryLabel(product.category_id)}</TableCell>
                <TableCell>{formatCurrency(product.price)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>{product.active ? 'Active' : 'Draft'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openProductDialog(product)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProduct(product)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedProduct ? 'Edit product' : 'Create product'}</DialogTitle></DialogHeader>
          <form onSubmit={saveProduct} className="grid gap-5 py-4 sm:grid-cols-2">
            <Field label="Name" name="name" value={formData.name} onChange={updateField} />
            <Field label="Slug" name="slug" value={formData.slug} onChange={updateField} />
            <div className="space-y-2 sm:col-span-2">
              <Label>Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData((current) => ({ ...current, category_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                <SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="short_description">Short description</Label>
              <Textarea id="short_description" name="short_description" value={formData.short_description} onChange={updateField} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Full description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={updateField} rows={5} />
            </div>
            <Field label="Price (NPR)" name="price" type="number" value={formData.price} onChange={updateField} />
            <Field label="Compare price" name="compare_at_price" type="number" value={formData.compare_at_price} onChange={updateField} required={false} />
            <Field label="Stock" name="stock" type="number" value={formData.stock} onChange={updateField} />
            <Field label="Rating" name="rating" type="number" value={formData.rating} onChange={updateField} required={false} />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input id="image_url" name="image_url" value={formData.image_url} onChange={updateField} required />
            </div>
            <ToggleRow label="Featured product" checked={formData.featured} onCheckedChange={(checked) => setFormData((current) => ({ ...current, featured: checked }))} />
            <ToggleRow label="Published" checked={formData.active} onCheckedChange={(checked) => setFormData((current) => ({ ...current, active: checked }))} />
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save product'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Product categories</DialogTitle></DialogHeader>
          <div className="space-y-3 py-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-lg border p-3">
                <span>{category.name}</span>
                <span className="text-xs text-muted-foreground">{products.filter((product) => product.category_id === category.id).length} products</span>
              </div>
            ))}
          </div>
          <form onSubmit={createCategory} className="flex gap-2">
            <Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="New category name" required />
            <Button type="submit" disabled={submitting}>Add</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, required = true }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} value={value} onChange={onChange} required={required} />
    </div>
  );
}

function ToggleRow({ label, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
