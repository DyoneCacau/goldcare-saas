import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Edit,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';
import { mockInventoryProducts, mockInventoryMovements } from '@/data/mockInventory';
import { InventoryProduct, InventoryMovement, inventoryCategoryLabels, movementTypeLabels } from '@/types/inventory';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FeatureButton } from '@/components/subscription/FeatureButton';
import { useFeatureAccess } from '@/components/subscription/FeatureAction';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function Inventory() {
  const { canAccess: canModifyStock } = useFeatureAccess('estoque');
  const [products, setProducts] = useState<InventoryProduct[]>(mockInventoryProducts);
  const [movements, setMovements] = useState<InventoryMovement[]>(mockInventoryMovements);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [movementNotes, setMovementNotes] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStock = stockFilter === 'all' || 
        (stockFilter === 'low' && product.currentStock <= product.minimumStock) ||
        (stockFilter === 'ok' && product.currentStock > product.minimumStock);
      return matchesSearch && matchesCategory && matchesStock && product.isActive;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const stats = useMemo(() => {
    const totalProducts = products.filter(p => p.isActive).length;
    const lowStock = products.filter(p => p.isActive && p.currentStock <= p.minimumStock).length;
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
    const todayMovements = movements.filter(m => m.date === format(new Date(), 'yyyy-MM-dd')).length;
    return { totalProducts, lowStock, totalValue, todayMovements };
  }, [products, movements]);

  const handleMovement = (product: InventoryProduct, type: 'entrada' | 'saida') => {
    setSelectedProduct(product);
    setMovementType(type);
    setMovementQuantity('');
    setMovementReason('');
    setMovementNotes('');
    setMovementDialogOpen(true);
  };

  const handleConfirmMovement = () => {
    if (!selectedProduct || !movementQuantity || !movementReason) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const qty = parseInt(movementQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantidade inválida');
      return;
    }

    if (movementType === 'saida' && qty > selectedProduct.currentStock) {
      toast.error('Quantidade maior que o estoque disponível');
      return;
    }

    const previousStock = selectedProduct.currentStock;
    const newStock = movementType === 'entrada' 
      ? previousStock + qty 
      : previousStock - qty;

    // Update product
    setProducts(prev => prev.map(p => 
      p.id === selectedProduct.id 
        ? { ...p, currentStock: newStock, updatedAt: new Date().toISOString() }
        : p
    ));

    // Add movement
    const newMovement: InventoryMovement = {
      id: `mov${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      type: movementType,
      quantity: qty,
      previousStock,
      newStock,
      reason: movementReason,
      userId: 'user1',
      userName: 'Admin',
      clinicId: selectedProduct.clinicId,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      notes: movementNotes || undefined,
    };

    setMovements(prev => [newMovement, ...prev]);
    setMovementDialogOpen(false);
    toast.success(`${movementType === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-7 w-7 text-primary" />
              Controle de Estoque
            </h1>
            <p className="text-muted-foreground">Gerencie os produtos e movimentações</p>
          </div>
          <FeatureButton feature="estoque">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </FeatureButton>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Produtos</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <ArrowUpDown className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Movimentações Hoje</p>
                  <p className="text-2xl font-bold">{stats.todayMovements}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou SKU..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {Object.entries(inventoryCategoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status Estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="ok">Estoque OK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Estoque Atual</TableHead>
                  <TableHead className="text-center">Mínimo</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.currentStock <= product.minimumStock;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground">{product.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {inventoryCategoryLabels[product.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isLowStock ? 'destructive' : 'secondary'}>
                          {product.currentStock} {product.unit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {product.minimumStock}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.costPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.currentStock * product.costPrice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <FeatureButton
                            feature="estoque"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600"
                            onClick={() => handleMovement(product, 'entrada')}
                            title="Entrada"
                          >
                            <ArrowDownToLine className="h-4 w-4" />
                          </FeatureButton>
                          <FeatureButton
                            feature="estoque"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleMovement(product, 'saida')}
                            title="Saída"
                          >
                            <ArrowUpFromLine className="h-4 w-4" />
                          </FeatureButton>
                          <FeatureButton feature="estoque" variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </FeatureButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle>Movimentações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead>Estoque Anterior → Novo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 10).map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-sm">
                      {movement.date} {movement.time}
                    </TableCell>
                    <TableCell className="font-medium">{movement.productName}</TableCell>
                    <TableCell>
                      <Badge variant={movement.type === 'entrada' ? 'default' : 'destructive'}>
                        {movement.type === 'entrada' ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {movementTypeLabels[movement.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.previousStock} → {movement.newStock}
                    </TableCell>
                    <TableCell>{movement.reason}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {movement.userName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Movement Dialog */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {movementType === 'entrada' ? (
                <ArrowDownToLine className="h-5 w-5 text-emerald-600" />
              ) : (
                <ArrowUpFromLine className="h-5 w-5 text-red-600" />
              )}
              {movementType === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} - Estoque atual: {selectedProduct?.currentStock} {selectedProduct?.unit}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={movementType === 'saida' ? selectedProduct?.currentStock : undefined}
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
                placeholder="Digite a quantidade"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo *</Label>
              <Select value={movementReason} onValueChange={setMovementReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {movementType === 'entrada' ? (
                    <>
                      <SelectItem value="Compra de estoque">Compra de estoque</SelectItem>
                      <SelectItem value="Devolução">Devolução</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                      <SelectItem value="Ajuste de inventário">Ajuste de inventário</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Consumo procedimentos">Consumo procedimentos</SelectItem>
                      <SelectItem value="Consumo diário">Consumo diário</SelectItem>
                      <SelectItem value="Vencimento">Vencimento</SelectItem>
                      <SelectItem value="Perda/Avaria">Perda/Avaria</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={movementNotes}
                onChange={(e) => setMovementNotes(e.target.value)}
                placeholder="Notas adicionais (opcional)"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmMovement}
              className={movementType === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              Confirmar {movementType === 'entrada' ? 'Entrada' : 'Saída'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
