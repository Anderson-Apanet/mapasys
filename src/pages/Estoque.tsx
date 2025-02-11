import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../utils/supabaseClient';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon, CubeIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Material {
  id: number;
  serialnb: string;
  tipo: string;
  id_modelo: number;
  etiqueta: string;
  observacoes: string;
  created_at: string;
  modelo?: ModeloMaterial; // Relacionamento com o modelo
  localizacao?: {
    localizacao_tipo: string;
    veiculo?: { placa: string };
    contrato?: { pppoe: string };
  };
}

interface ModeloMaterial {
  id: number;
  nome: string;
  marca: string;
  created_at: string;
}

interface ModeloSummary {
  id: number;
  nome: string;
  marca: string;
  quantidade: number;
  tipo: string;
}

type TabType = 'materiais' | 'modelos';

const Estoque: React.FC = () => {
  const navigate = useNavigate();
  const tiposMaterial = [
    'Roteador',
    'Onu',
    'Cabo',
    'Switch',
    'Outros'
  ];

  const [activeTab, setActiveTab] = useState<TabType>('materiais');
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [modelosSummary, setModelosSummary] = useState<ModeloSummary[]>([]);
  const [selectedModelo, setSelectedModelo] = useState<number | null>(null);
  const [modelos, setModelos] = useState<ModeloMaterial[]>([]);
  const [modelosPorTipo, setModelosPorTipo] = useState<ModeloMaterial[]>([]);
  const [filtroModelosPorTipo, setFiltroModelosPorTipo] = useState<ModeloMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modeloModalOpen, setModeloModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingModelo, setEditingModelo] = useState<ModeloMaterial | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [modelosCurrentPage, setModelosCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modelosTotalPages, setModelosTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    serialnb: '',
    tipo: '',
    modelo: '',
    etiqueta: ''
  });
  const [modeloFilters, setModeloFilters] = useState({
    nome: '',
    marca: ''
  });
  const [formData, setFormData] = useState({
    serialnb: '',
    tipo: '',
    id_modelo: 0,
    etiqueta: '',
    observacoes: ''
  });
  const [modeloFormData, setModeloFormData] = useState({
    nome: '',
    marca: ''
  });

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [moveForm, setMoveForm] = useState({
    localizacao_tipo: 'empresa',
    veiculo_id: null as number | null,
    contrato_id: null as number | null
  });
  const [veiculos, setVeiculos] = useState<Array<{ id: number; placa: string; nome: string }>>([]);
  const [contratos, setContratos] = useState<Array<{ id: number; numero: string; pppoe: string }>>([]);
  const [contratoSearch, setContratoSearch] = useState('');
  const [contratoSearchResults, setContratoSearchResults] = useState<Array<{ id: number; numero: string; pppoe: string }>>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    tipo: string;
    veiculo?: { id: number; placa: string; nome: string };
    contrato?: { id: number; numero: string; pppoe: string };
  } | null>(null);

  // Função para renderizar a localização do material
  const renderLocalizacao = (material: Material) => {
    if (!material.localizacao) return 'Empresa';
    
    switch (material.localizacao.localizacao_tipo) {
      case 'empresa':
        return 'Empresa';
      case 'veiculo':
        return `Veículo: ${material.localizacao.veiculo?.placa || ''}`;
      case 'contrato':
        return `Contrato: ${material.localizacao.contrato?.pppoe || ''}`;
      default:
        return 'Empresa';
    }
  };

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Buscar materiais e modelos
  const fetchMateriais = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('materiais')
        .select(`
          *,
          modelo:modelo_materiais(id, nome, marca)
        `, { count: 'exact' });

      // Se um modelo específico foi selecionado, filtrar por ele
      if (selectedModelo) {
        query = query.eq('id_modelo', selectedModelo);
        
        // Aplicar filtros adicionais apenas na visualização detalhada
        if (filters.serialnb) {
          query = query.ilike('serialnb', `%${filters.serialnb}%`);
        }
        if (filters.tipo) {
          query = query.eq('tipo', filters.tipo);
        }
        if (filters.etiqueta) {
          query = query.ilike('etiqueta', `%${filters.etiqueta}%`);
        }

        // Aplicar paginação apenas na visualização detalhada
        const { from, to } = getPaginationRange(currentPage, itemsPerPage);
        query = query.range(from, to);
      }

      query = query.order('created_at', { ascending: false });

      const { data: materiaisData, error: materiaisError, count } = await query;

      if (materiaisError) throw materiaisError;

      // Para cada material, buscar sua localização atual
      const materiaisComLocalizacao = await Promise.all(
        (materiaisData || []).map(async (material) => {
          const { data: localizacao } = await supabase
            .from('localizacao_materiais')
            .select(`
              localizacao_tipo,
              veiculo:veiculos(placa),
              contrato:contratos(pppoe)
            `)
            .eq('material_id', material.id)
            .order('data_atualizacao', { ascending: false })
            .limit(1)
            .single();

          return {
            ...material,
            localizacao: localizacao || { localizacao_tipo: 'empresa' }
          };
        })
      );

      setMateriais(materiaisComLocalizacao || []);
      
      if (selectedModelo) {
        setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      } else {
        setModelosSummary(agruparMateriaisPorModelo(materiaisComLocalizacao || []));
      }
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  };

  const fetchModelos = async () => {
    setLoading(true);
    try {
      const { from, to } = getPaginationRange(modelosCurrentPage, itemsPerPage);
      let query = supabase
        .from('modelo_materiais')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('nome');
    
      if (modeloFilters.nome) {
        query = query.ilike('nome', `%${modeloFilters.nome}%`);
      }

      if (modeloFilters.marca) {
        query = query.ilike('marca', `%${modeloFilters.marca}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        if (error.code === '42P01') {
          console.error('Tabela não encontrada:', error);
          toast.error('Erro ao carregar modelos: Tabela não encontrada');
        } else {
          console.error('Erro ao buscar modelos:', error);
          toast.error('Erro ao carregar modelos');
        }
        return;
      }
      setModelos(data || []);
      setModelosTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  };

  const getPaginationRange = (page: number, perPage: number) => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    return { from, to };
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleModeloPageChange = (page: number) => {
    setModelosCurrentPage(page);
  };

  useEffect(() => {
    fetchMateriais();
  }, [selectedModelo, currentPage, filters]);

  useEffect(() => {
    fetchModelos();
  }, [modelosCurrentPage, modeloFilters]);

  // Funções do CRUD
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingMaterial) {
        // Atualizar material existente
        const { error } = await supabase
          .from('materiais')
          .update({
            serialnb: formData.serialnb,
            tipo: formData.tipo,
            id_modelo: formData.id_modelo,
            etiqueta: formData.etiqueta,
            observacoes: formData.observacoes
          })
          .eq('id', editingMaterial.id);

        if (error) throw error;
        toast.success('Material atualizado com sucesso!');
      } else {
        // Criar novo material
        const { data: newMaterial, error: materialError } = await supabase
          .from('materiais')
          .insert([{
            serialnb: formData.serialnb,
            tipo: formData.tipo,
            id_modelo: formData.id_modelo,
            etiqueta: formData.etiqueta,
            observacoes: formData.observacoes
          }])
          .select()
          .single();

        if (materialError) throw materialError;

        // Inserir localização inicial do material
        const { error: locationError } = await supabase
          .from('localizacao_materiais')
          .insert([{
            material_id: newMaterial.id,
            localizacao_tipo: 'empresa',
            empresa: true,
            veiculo_id: null,
            contrato_id: null
          }]);

        if (locationError) {
          console.error('Erro ao salvar localização:', locationError);
          toast.error('Material cadastrado, mas houve um erro ao definir sua localização');
        } else {
          toast.success('Material cadastrado com sucesso!');
        }
      }

      resetForm();
      setModalOpen(false);
      setEditingMaterial(null);
      fetchMateriais();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      toast.error('Erro ao salvar material');
    } finally {
      setLoading(false);
    }
  };

  const handleModeloSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModelo) {
        // Atualizar modelo existente
        const { error } = await supabase
          .from('modelo_materiais')
          .update({
            nome: modeloFormData.nome,
            marca: modeloFormData.marca
          })
          .eq('id', editingModelo.id);

        if (error) throw error;
        toast.success('Modelo atualizado com sucesso!');
      } else {
        // Criar novo modelo
        const { error } = await supabase
          .from('modelo_materiais')
          .insert([modeloFormData]);

        if (error) throw error;
        toast.success('Modelo cadastrado com sucesso!');
      }

      setModeloModalOpen(false);
      resetModeloForm();
      setEditingModelo(null);
      fetchModelos();
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
      toast.error('Erro ao salvar modelo');
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este material?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('materiais')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Material excluído com sucesso!');
      fetchMateriais();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
      toast.error('Erro ao excluir material');
    }
  };

  const handleModeloDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este modelo?')) {
      try {
        const { error } = await supabase
          .from('modelo_materiais')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success('Modelo excluído com sucesso!');
        fetchModelos();
      } catch (error) {
        console.error('Erro ao excluir modelo:', error);
        toast.error('Erro ao excluir modelo');
      }
    }
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      serialnb: material.serialnb,
      tipo: material.tipo,
      id_modelo: material.id_modelo,
      etiqueta: material.etiqueta,
      observacoes: material.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleModeloEdit = (modelo: ModeloMaterial) => {
    setEditingModelo(modelo);
    setModeloFormData({
      nome: modelo.nome,
      marca: modelo.marca
    });
    setModeloModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      serialnb: '',
      tipo: '',
      id_modelo: 0,
      etiqueta: '',
      observacoes: ''
    });
  };

  const resetModeloForm = () => {
    setModeloFormData({
      nome: '',
      marca: ''
    });
  };

  // Buscar veículos e contratos
  const fetchVeiculos = async () => {
    const { data, error } = await supabase
      .from('veiculos')
      .select('id, placa')
      .order('placa');
    
    if (error) {
      console.error('Erro ao buscar veículos:', error);
      return;
    }
    setVeiculos(data || []);
  };

  const fetchContratos = async () => {
    const { data, error } = await supabase
      .from('contratos')
      .select('id, pppoe')
      .order('pppoe');
    
    if (error) {
      console.error('Erro ao buscar contratos:', error);
      return;
    }
    setContratos(data || []);
  };

  // Buscar localização atual do material
  const fetchCurrentLocation = async (materialId: number) => {
    try {
      const { data: existingLocation, error: locationError } = await supabase
        .from('localizacao_materiais')
        .select(`
          id,
          localizacao_tipo,
          veiculo:veiculos(id, placa),
          contrato:contratos(id, pppoe)
        `)
        .eq('material_id', materialId)
        .order('data_atualizacao', { ascending: false })
        .limit(1)
        .single();

      if (locationError && locationError.code === 'PGRST116') {
        // Nenhuma localização encontrada, criar uma nova com tipo 'empresa'
        const { error: insertError } = await supabase
          .from('localizacao_materiais')
          .insert({
            material_id: materialId,
            localizacao_tipo: 'empresa',
            veiculo_id: null,
            contrato_id: null,
            empresa: true
          });

        if (insertError) {
          console.error('Erro ao criar localização inicial:', insertError);
          return;
        }

        setCurrentLocation({ tipo: 'empresa' });
        return;
      }

      if (locationError) {
        console.error('Erro ao buscar localização:', locationError);
        return;
      }

      if (existingLocation) {
        setCurrentLocation({
          tipo: existingLocation.localizacao_tipo,
          veiculo: existingLocation.veiculo,
          contrato: existingLocation.contrato
        });
      }
    } catch (error) {
      console.error('Erro ao processar localização:', error);
    }
  };

  // Buscar contratos baseado na pesquisa
  const searchContratos = async (search: string) => {
    if (!search.trim()) {
      setContratoSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('contratos')
      .select('id, pppoe')
      .ilike('pppoe', `%${search}%`)
      .order('pppoe')
      .limit(10);
    
    if (error) {
      console.error('Erro ao buscar contratos:', error);
      return;
    }
    setContratoSearchResults(data || []);
  };

  // Efeito para buscar contratos quando o usuário digita
  useEffect(() => {
    const timer = setTimeout(() => {
      searchContratos(contratoSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [contratoSearch]);

  // Função para mover material
  const handleMove = async () => {
    if (!selectedMaterial) return;

    const { error } = await supabase
      .from('localizacao_materiais')
      .insert({
        material_id: selectedMaterial.id,
        localizacao_tipo: moveForm.localizacao_tipo,
        veiculo_id: moveForm.localizacao_tipo === 'veiculo' ? moveForm.veiculo_id : null,
        contrato_id: moveForm.localizacao_tipo === 'contrato' ? moveForm.contrato_id : null,
        empresa: moveForm.localizacao_tipo === 'empresa'
      });

    if (error) {
      console.error('Erro ao mover material:', error);
      toast.error('Erro ao mover material');
      return;
    }

    toast.success('Material movido com sucesso!');
    setMoveModalOpen(false);
    setSelectedMaterial(null);
    setMoveForm({
      localizacao_tipo: 'empresa',
      veiculo_id: null,
      contrato_id: null
    });
    fetchCurrentLocation(selectedMaterial.id);
  };

  useEffect(() => {
    if (moveModalOpen) {
      fetchVeiculos();
      fetchContratos();
    }
  }, [moveModalOpen]);

  useEffect(() => {
    if (selectedMaterial) {
      fetchCurrentLocation(selectedMaterial.id);
    }
  }, [selectedMaterial]);

  // Função para buscar modelos por tipo
  const fetchModelosPorTipo = async (tipo: string) => {
    if (!tipo) {
      setModelosPorTipo([]);
      return;
    }

    try {
      // Primeiro buscar todos os materiais deste tipo para pegar os IDs dos modelos usados
      const { data: materiaisTipo, error: materiaisError } = await supabase
        .from('materiais')
        .select('id_modelo')
        .eq('tipo', tipo)
        .not('id_modelo', 'is', null);

      if (materiaisError) throw materiaisError;

      // Extrair IDs únicos dos modelos
      const modeloIds = [...new Set(materiaisTipo?.map(m => m.id_modelo) || [])];

      if (modeloIds.length > 0) {
        // Buscar os modelos correspondentes
        const { data: modelosData, error: modelosError } = await supabase
          .from('modelo_materiais')
          .select('*')
          .in('id', modeloIds)
          .order('nome');

        if (modelosError) throw modelosError;
        setModelosPorTipo(modelosData || []);
      } else {
        // Se não houver materiais deste tipo, buscar todos os modelos
        const { data: todosModelos, error: todosModelosError } = await supabase
          .from('modelo_materiais')
          .select('*')
          .order('nome');

        if (todosModelosError) throw todosModelosError;
        setModelosPorTipo(todosModelos || []);
      }
    } catch (error) {
      console.error('Erro ao buscar modelos por tipo:', error);
      toast.error('Erro ao carregar modelos');
    }
  };

  // Atualizar modelos quando o tipo mudar
  useEffect(() => {
    if (modalOpen) {
      fetchModelosPorTipo(formData.tipo);
    }
  }, [formData.tipo, modalOpen]);

  // Função para buscar modelos por tipo para o filtro
  const fetchFiltroModelosPorTipo = async (tipo: string) => {
    if (!tipo) {
      setFiltroModelosPorTipo([]);
      return;
    }

    try {
      // Primeiro buscar todos os materiais deste tipo para pegar os IDs dos modelos usados
      const { data: materiaisTipo, error: materiaisError } = await supabase
        .from('materiais')
        .select('id_modelo')
        .eq('tipo', tipo)
        .not('id_modelo', 'is', null);

      if (materiaisError) throw materiaisError;

      // Extrair IDs únicos dos modelos
      const modeloIds = [...new Set(materiaisTipo?.map(m => m.id_modelo) || [])];

      if (modeloIds.length > 0) {
        // Buscar os modelos correspondentes
        const { data: modelosData, error: modelosError } = await supabase
          .from('modelo_materiais')
          .select('*')
          .in('id', modeloIds)
          .order('nome');

        if (modelosError) throw modelosError;
        setFiltroModelosPorTipo(modelosData || []);
      } else {
        // Se não houver materiais deste tipo, buscar todos os modelos
        const { data: todosModelos, error: todosModelosError } = await supabase
          .from('modelo_materiais')
          .select('*')
          .order('nome');

        if (todosModelosError) throw todosModelosError;
        setFiltroModelosPorTipo(todosModelos || []);
      }
    } catch (error) {
      console.error('Erro ao buscar modelos por tipo:', error);
      toast.error('Erro ao carregar modelos');
    }
  };

  // Atualizar modelos quando o tipo do filtro mudar
  useEffect(() => {
    fetchFiltroModelosPorTipo(filters.tipo);
  }, [filters.tipo]);

  // Handler para mudança do tipo no filtro
  const handleFiltroTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoTipo = e.target.value;
    setFilters({
      ...filters,
      tipo: novoTipo,
      modelo: '' // Resetar o modelo quando mudar o tipo
    });
  };

  // No formulário de material, atualizar o campo tipo
  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoTipo = e.target.value;
    setFormData({
      ...formData,
      tipo: novoTipo,
      id_modelo: 0 // Resetar o modelo quando mudar o tipo
    });
  };

  // Função para agrupar materiais por modelo
  const agruparMateriaisPorModelo = (materiais: Material[]) => {
    const summary = materiais.reduce((acc: { [key: number]: ModeloSummary }, material) => {
      if (material.modelo) {
        const modeloId = material.modelo.id;
        if (!acc[modeloId]) {
          acc[modeloId] = {
            id: modeloId,
            nome: material.modelo.nome,
            marca: material.modelo.marca,
            quantidade: 0,
            tipo: material.tipo
          };
        }
        acc[modeloId].quantidade += 1;
      }
      return acc;
    }, {});

    return Object.values(summary);
  };

  useEffect(() => {
    fetchMateriais();
  }, [selectedModelo, currentPage, filters]);

  useEffect(() => {
    if (!selectedModelo) {
      setFilters({
        serialnb: '',
        tipo: '',
        modelo: '',
        etiqueta: ''
      });
      setCurrentPage(1);
    }
  }, [selectedModelo]);

  // Função para iniciar o processo de movimentação de material
  const handleMoveMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setMoveModalOpen(true);
    // Resetar o formulário de movimentação
    setMoveForm({
      localizacao_tipo: 'empresa',
      veiculo_id: null,
      contrato_id: null
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-white">
              {selectedModelo ? 'Materiais do Modelo' : 'Sumário do Estoque'}
            </h1>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
            {selectedModelo && (
              <button
                onClick={() => {
                  setSelectedModelo(null);
                  setCurrentPage(1);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
              >
                Voltar ao Sumário
              </button>
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Material
            </button>
            <button
              onClick={() => setModeloModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <CubeIcon className="h-4 w-4 mr-2" />
              Novo Modelo
            </button>
          </div>
        </div>

        {/* Filtros - Mostrar apenas na visualização detalhada */}
        {selectedModelo && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <input
              type="text"
              placeholder="Serial"
              value={filters.serialnb}
              onChange={(e) => setFilters({ ...filters, serialnb: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <select
              value={filters.tipo}
              onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Tipo</option>
              {tiposMaterial.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Etiqueta"
              value={filters.etiqueta}
              onChange={(e) => setFilters({ ...filters, etiqueta: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        )}

        {/* Tabela */}
        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedModelo ? (
                        <>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Serial
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Tipo
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Etiqueta
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Localização
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Ações</span>
                          </th>
                        </>
                      ) : (
                        <>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Modelo
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Marca
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Tipo
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Quantidade
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {selectedModelo ? (
                      // Lista detalhada de materiais do modelo selecionado
                      materiais.map((material) => (
                        <tr key={material.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {material.serialnb}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {material.tipo}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {material.etiqueta}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {renderLocalizacao(material)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditMaterial(material)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(material.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleMoveMaterial(material)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <ArrowsRightLeftIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      // Lista sumarizada por modelo
                      modelosSummary.map((modelo) => (
                        <tr
                          key={modelo.id}
                          onClick={() => {
                            setSelectedModelo(modelo.id);
                            setCurrentPage(1);
                            setFilters({
                              serialnb: '',
                              tipo: '',
                              modelo: '',
                              etiqueta: ''
                            });
                          }}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {modelo.nome}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {modelo.marca}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {modelo.tipo}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {modelo.quantidade}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Paginação - Mostrar apenas na visualização detalhada */}
        {selectedModelo && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}

        {/* Manter os modais existentes */}
        {/* Modal de Cadastro/Edição de Material */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#E8F5E9] dark:bg-[#1B5E20] rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SerialNB
                    </label>
                    <input
                      type="text"
                      value={formData.serialnb}
                      onChange={(e) => setFormData({ ...formData, serialnb: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Selecione um tipo</option>
                      {tiposMaterial.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Modelo
                    </label>
                    <select
                      value={formData.id_modelo}
                      onChange={(e) => setFormData({ ...formData, id_modelo: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                      disabled={!formData.tipo} // Desabilitar se não houver tipo selecionado
                    >
                      <option value="">Selecione um modelo</option>
                      {modelosPorTipo.map((modelo) => (
                        <option key={modelo.id} value={modelo.id}>
                          {modelo.nome} - {modelo.marca}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Etiqueta
                    </label>
                    <input
                      type="text"
                      value={formData.etiqueta}
                      onChange={(e) => setFormData({ ...formData, etiqueta: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-md shadow-sm transition-colors duration-200"
                  >
                    {editingMaterial ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Cadastro de Modelo */}
        {modeloModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#E8F5E9] dark:bg-[#1B5E20] rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {editingModelo ? 'Editar Modelo' : 'Novo Modelo'}
              </h2>
              <form onSubmit={handleModeloSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do Modelo
                  </label>
                  <input
                    type="text"
                    value={modeloFormData.nome}
                    onChange={(e) => setModeloFormData({ ...modeloFormData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={modeloFormData.marca}
                    onChange={(e) => setModeloFormData({ ...modeloFormData, marca: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setModeloModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-md shadow-sm transition-colors duration-200"
                  >
                    {editingModelo ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Movimentação */}
        {moveModalOpen && selectedMaterial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Movimentar Material: {selectedMaterial.serialnb}
              </h3>

              {/* Localização Atual */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Localização Atual:
                </h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Tipo:</span> {currentLocation?.tipo.charAt(0).toUpperCase() + currentLocation?.tipo.slice(1)}
                  </p>
                  {currentLocation?.tipo === 'veiculo' && currentLocation.veiculo && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Veículo:</span> {currentLocation.veiculo.placa}
                    </p>
                  )}
                  {currentLocation?.tipo === 'contrato' && currentLocation.contrato && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Contrato:</span> {currentLocation.contrato.pppoe}
                    </p>
                  )}
                </div>
              </div>

              {/* Formulário de Movimentação */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Novo Destino
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={moveForm.localizacao_tipo}
                    onChange={(e) => setMoveForm({
                      ...moveForm,
                      localizacao_tipo: e.target.value,
                      veiculo_id: null,
                      contrato_id: null
                    })}
                  >
                    <option value="empresa">Empresa</option>
                    <option value="veiculo">Veículo</option>
                    <option value="contrato">Contrato</option>
                  </select>
                </div>

                {moveForm.localizacao_tipo === 'veiculo' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Veículo
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={moveForm.veiculo_id || ''}
                      onChange={(e) => setMoveForm({
                        ...moveForm,
                        veiculo_id: e.target.value ? Number(e.target.value) : null
                      })}
                    >
                      <option value="">Selecione um veículo</option>
                      {veiculos.map((veiculo) => (
                        <option key={veiculo.id} value={veiculo.id}>
                          {veiculo.placa}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {moveForm.localizacao_tipo === 'contrato' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pesquisar Contrato
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={contratoSearch}
                        onChange={(e) => setContratoSearch(e.target.value)}
                        placeholder="Digite o número ou PPPOE do contrato"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {contratoSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                          {contratoSearchResults.map((contrato) => (
                            <button
                              key={contrato.id}
                              onClick={() => {
                                setMoveForm({
                                  ...moveForm,
                                  contrato_id: contrato.id
                                });
                                setContratoSearch(contrato.pppoe);
                                setContratoSearchResults([]);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              {contrato.pppoe}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setMoveModalOpen(false);
                    setSelectedMaterial(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleMove}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Estoque;
